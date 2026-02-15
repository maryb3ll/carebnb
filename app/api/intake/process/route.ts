import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { supabase } from "@/lib/supabase";
import { DEMO_PATIENT_ID, getPatientIdForUser } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

/**
 * Process AI-powered intake - accepts text or audio
 * Runs the audio-model pipeline and uploads results to Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    // Get access token from request
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    console.log('\n=== Intake API called ===');
    console.log('Has access token:', !!accessToken);
    console.log('Access token (first 20 chars):', accessToken?.substring(0, 20) || 'NONE');

    const patientId = accessToken ? await getPatientIdForUser(accessToken) : null;
    console.log('Patient ID from getPatientIdForUser:', patientId);

    const resolvedPatientId = patientId ?? DEMO_PATIENT_ID;
    console.log('Resolved Patient ID:', resolvedPatientId);
    console.log('Using DEMO_PATIENT_ID?', resolvedPatientId === DEMO_PATIENT_ID);

    const formData = await request.formData();
    const textInput = formData.get("text") as string | null;
    const audioFile = formData.get("audio") as File | null;
    let careRequestId = formData.get("careRequestId") as string | null;
    const requestedTime = formData.get("requestedTime") as string | null;

    console.log('careRequestId received:', careRequestId);
    console.log('Has text:', !!textInput);
    console.log('Has audio:', !!audioFile);

    // If no careRequestId provided, create one now
    if (!careRequestId) {
      console.log('No careRequestId provided - creating new care_request...');
      const { data: newRequest, error: createError } = await supabase
        .from("care_requests")
        .insert({
          patient_id: resolvedPatientId,
          service: "nursing",
          description: "AI-powered intake submission",
          requested_start: requestedTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: `POINT(-122.42 37.77)`,
          status: "open",
        })
        .select("id")
        .single();

      if (createError || !newRequest) {
        console.error('Failed to create care_request:', createError);
      } else {
        careRequestId = newRequest.id;
        console.log('✓ Created new care_request with ID:', careRequestId);
      }
    }

    console.log('========================\n');

    if (!textInput && !audioFile) {
      return NextResponse.json(
        { error: "Either text or audio input is required" },
        { status: 400 }
      );
    }

    // Generate unique session ID for this intake
    const sessionId = randomUUID();
    const tempDir = join(process.cwd(), "audio-model", "temp", sessionId);

    // Create temp directory
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    let inputPath: string;
    let isAudio = false;

    if (audioFile) {
      // Save audio file
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);
      const audioExt = audioFile.name.split(".").pop() || "m4a";
      inputPath = join(tempDir, `input.${audioExt}`);
      await writeFile(inputPath, audioBuffer);
      isAudio = true;
    } else if (textInput) {
      // Save text as .txt file (Python script will read it)
      inputPath = join(tempDir, "input.txt");
      await writeFile(inputPath, textInput, "utf-8");
      isAudio = false;
    } else {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Run the audio-model pipeline
    const pipelineDir = join(process.cwd(), "audio-model");
    const runScriptPath = join(pipelineDir, "run_intake.py");

    const inputType = isAudio ? "audio" : "text";

    console.log("Running audio-model pipeline...");
    console.log(`Type: ${inputType}, Input: ${inputPath}`);

    // For text, we now need to read the file in Python and pass content
    // But for now, let's use a different approach - save text to file and read in Python
    const { stdout, stderr } = await execAsync(
      isAudio
        ? `cd "${pipelineDir}" && /home/kitte/anaconda3/bin/python3 "${runScriptPath}" audio "${inputPath}"`
        : `cd "${pipelineDir}" && /home/kitte/anaconda3/bin/python3 "${runScriptPath}" text-file "${inputPath}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    if (stderr) {
      console.log("Pipeline stderr:", stderr);
    }

    // Parse JSON output - extract last line which should be the JSON result
    let pipelineResult;
    try {
      const lines = stdout.trim().split('\n');
      const jsonLine = lines[lines.length - 1]; // Last line should be JSON
      pipelineResult = JSON.parse(jsonLine);
    } catch (e) {
      console.error("Failed to parse pipeline output:", stdout);
      console.error("Parse error:", e);
      return NextResponse.json(
        { error: "Pipeline output parsing failed", details: stdout.substring(0, 500) },
        { status: 500 }
      );
    }

    if (!pipelineResult.success) {
      return NextResponse.json(
        { error: "Pipeline execution failed", details: pipelineResult.error },
        { status: 500 }
      );
    }

    console.log(`Pipeline completed. Session ID: ${pipelineResult.session_id}`);

    // Use the path from pipeline result
    const zipPath = pipelineResult.final_zip_path;

    if (!existsSync(zipPath)) {
      console.error(`Expected zip at: ${zipPath}`);
      return NextResponse.json(
        { error: "Pipeline completed but final.zip not found", path: zipPath },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const uniqueId = pipelineResult.session_id.substring(0, 8);
    const zipFileName = `final_${uniqueId}.zip`;

    const zipBuffer = await require("fs/promises").readFile(zipPath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("carebnbstoragebucket")
      .upload(zipFileName, zipBuffer, {
        contentType: "application/zip",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload to storage", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("carebnbstoragebucket")
      .getPublicUrl(zipFileName);

    const pdfUrl = urlData.publicUrl;

    // Upload audio file to storage if it was audio input
    let audioUrl: string | null = null;
    if (isAudio && audioFile) {
      const audioFileName = `audio_${uniqueId}.${audioFile.name.split(".").pop() || "m4a"}`;
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);

      const { data: audioUploadData, error: audioUploadError } = await supabase.storage
        .from("carebnbstoragebucket")
        .upload(audioFileName, audioBuffer, {
          contentType: audioFile.type || "audio/m4a",
          upsert: false,
        });

      if (!audioUploadError) {
        const { data: audioUrlData } = supabase.storage
          .from("carebnbstoragebucket")
          .getPublicUrl(audioFileName);
        audioUrl = audioUrlData.publicUrl;
        console.log('Audio uploaded:', audioUrl);
      } else {
        console.error('Failed to upload audio:', audioUploadError);
      }
    }

    // Get transcript from pipeline result or original text
    const transcript = pipelineResult.transcript || textInput || null;
    const intakeType = isAudio ? 'audio' : 'text';

    // Update care_request if careRequestId provided
    if (careRequestId) {
      console.log('Updating care_request:', careRequestId, 'with PDF URL, audio, and transcript');
      const { data: careRequest, error } = await supabase
        .from("care_requests")
        .update({
          pdf_url: pdfUrl,
          audio_url: audioUrl,
          transcript: transcript,
          intake_type: intakeType,
          updated_at: new Date().toISOString()
        })
        .eq("id", careRequestId)
        .select("patient_id, service, requested_start, location")
        .single();

      if (error) {
        console.error('Failed to update care_request:', error);
      } else {
        console.log('Successfully updated care_request');

        // Match with best provider and create pending booking
        if (careRequest) {
          try {
            // Extract coordinates from location (POINT format)
            const locationMatch = careRequest.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            const lng = locationMatch ? parseFloat(locationMatch[1]) : -122.42;
            const lat = locationMatch ? parseFloat(locationMatch[2]) : 37.77;

            console.log('Matching providers with:', {
              service: careRequest.service || 'nursing',
              lat,
              lng,
              location: careRequest.location,
              radius_km: 50
            });

            // Find best matching provider
            const { data: providers, error: matchError } = await supabase
              .rpc('match_providers', {
                p_service: careRequest.service || 'nursing',
                p_lat: lat,
                p_lng: lng,
                p_when: careRequest.requested_start,
                p_radius_km: 50,
                p_limit_n: 1
              });

            console.log('Match result:', {
              providersCount: providers?.length || 0,
              error: matchError,
              firstProvider: providers?.[0]?.id || 'none'
            });

            if (!matchError && providers && providers.length > 0) {
              const bestProvider = providers[0];
              console.log('Matched with provider:', bestProvider.id);

              // Create pending booking
              const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .insert({
                  provider_id: bestProvider.id,
                  patient_id: careRequest.patient_id,
                  care_request_id: careRequestId,
                  service: careRequest.service || 'nursing',
                  scheduled_at: careRequest.requested_start,
                  status: 'pending'
                })
                .select("id")
                .single();

              if (bookingError) {
                console.error('Failed to create pending booking:', bookingError);
              } else {
                console.log('Created pending booking:', booking?.id);
              }
            } else {
              console.log('No matching providers found or error:', matchError);
            }
          } catch (matchErr) {
            console.error('Error matching providers:', matchErr);
          }
        }
      }
    } else {
      console.log('No careRequestId provided - skipping care_request update');
    }

    // Clean up temp files
    try {
      await execAsync(`rm -rf "${tempDir}"`);
    } catch (e) {
      console.warn("Failed to clean up temp files:", e);
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      sessionId: pipelineResult.session_id,
      zipFileName,
    });

  } catch (error) {
    console.error("Intake processing error:", error);
    return NextResponse.json(
      { error: "Failed to process intake", details: String(error) },
      { status: 500 }
    );
  }
}
