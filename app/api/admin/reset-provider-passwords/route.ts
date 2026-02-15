import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Reset all provider passwords back to Provider123!
 */
export async function POST(request: NextRequest) {
  try {
    const correctPassword = "Provider123!";
    const results: any[] = [];

    // Get all users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: "Failed to list users", details: listError.message },
        { status: 500 }
      );
    }

    const users = usersData?.users || [];

    // Reset password for all provider users
    for (const user of users) {
      if (user.email && user.email.includes('@carebnb.demo')) {
        try {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: correctPassword }
          );

          if (updateError) {
            results.push({
              email: user.email,
              user_id: user.id,
              status: "FAILED",
              error: updateError.message,
            });
          } else {
            results.push({
              email: user.email,
              user_id: user.id,
              status: "SUCCESS",
              password: correctPassword,
            });
          }
        } catch (error) {
          results.push({
            email: user.email,
            user_id: user.id,
            status: "ERROR",
            error: String(error),
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === "SUCCESS").length;
    const failCount = results.filter(r => r.status === "FAILED" || r.status === "ERROR").length;

    return NextResponse.json({
      success: true,
      message: "Provider passwords have been reset",
      summary: {
        total_updated: results.length,
        successful: successCount,
        failed: failCount,
      },
      password: correctPassword,
      results,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Password reset failed", details: String(error) },
      { status: 500 }
    );
  }
}
