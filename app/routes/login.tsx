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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  const { supabase, headers } = createSupabaseServerClient(request);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide a more helpful message for email not confirmed error
    let errorMessage = error.message;
    if (error.message.toLowerCase().includes("email not confirmed")) {
      errorMessage = "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
    }
    return json({ error: errorMessage }, { status: 400 });
  }

  return redirect("/", { headers });
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
            <p className="mt-2 text-sm text-gray-600">
              Access your CMS account
            </p>
          </div>

          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{actionData.error}</p>
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
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign up
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
