import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Test password reset for a single user (Bryan)
 */
export async function POST(request: NextRequest) {
  try {
    const correctPassword = "Provider123!";
    const testEmail = "bryan.drucker@carebnb.demo";

    // Try to get user by email
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        {
          error: "Failed to list users",
          details: listError.message,
          code: listError.code,
          status: listError.status,
        },
        { status: 500 }
      );
    }

    const user = usersData?.users?.find(u => u.email === testEmail);

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${testEmail}` },
        { status: 404 }
      );
    }

    // Try to update password
    const { error: updateError, data: updateData } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: correctPassword }
    );

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to update password",
          details: updateError.message,
          code: updateError.code,
          status: updateError.status,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset for ${testEmail}`,
      user_id: user.id,
      email: user.email,
      new_password: correctPassword,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Password reset failed", details: String(error) },
      { status: 500 }
    );
  }
}
