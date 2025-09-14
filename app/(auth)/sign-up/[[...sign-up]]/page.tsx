import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function Page() {
  // Add error boundary
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in sign-up page");
    return <div>Error: Authentication not configured properly</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-500 hover:bg-blue-600 text-white",
            },
          }}
        />
      </Suspense>
    </div>
  );
}