import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function constantTimeTokenMatches(expected: string, supplied: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

export function operatorAuthorization(request: Request): NextResponse | null {
  const configured = process.env.ADMIN_TOKEN;
  if (
    !configured ||
    configured.length < 32 ||
    configured.startsWith("replace-with-")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ADMIN_TOKEN .env.local faylında konfiqurasiya edilməyib. Ən azı 32 simvolluq secret əlavə edib serveri yenidən başladın.",
      },
      { status: 503 },
    );
  }

  const valid = constantTimeTokenMatches(
    configured,
    request.headers.get("x-admin-token") ?? "",
  );

  if (!valid) {
    return NextResponse.json({ ok: false, error: "icazə yoxdur" }, { status: 401 });
  }
  return null;
}
