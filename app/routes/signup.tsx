import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, Form, Link } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { getUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return json({});
}

type ActionResponse =
  | { error: string }
  | { success: string };

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!email || !password || !confirmPassword) {
    return json<ActionResponse>(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json<ActionResponse>(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json<ActionResponse>(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const { supabase, headers } = createSupabaseServerClient(request);

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return json<ActionResponse>({ error: error.message }, { status: 400 });
  }

  return json<ActionResponse>(
    { success: "Account created! Please check your email to confirm your account before signing in." },
    { headers }
  );
}

export default function Signup() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create your CMS account
            </p>
          </div>

          <Form method="post" className="space-y-6">
            {actionData && "error" in actionData && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{actionData.error}</p>
              </div>
            )}

            {actionData && "success" in actionData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">Account created successfully!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p className="mb-2">Please check your email to confirm your account before signing in.</p>
                      <p className="text-xs">
                        <strong>Note:</strong> If you don't see the email, check your spam folder.
                        Once confirmed, you can <Link to="/login" className="underline font-medium hover:text-green-900">sign in here</Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="new-password"
                className="input-field"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                autoComplete="new-password"
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Account
            </button>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
