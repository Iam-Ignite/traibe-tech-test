import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  Link,
  Form,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUser } from "./lib/auth.server";
import "./styles/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
  return json({ user, env });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, env } = useLoaderData<typeof loader>();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(env)}`,
        }}
      />
      {user && (
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  CMS
                </Link>
                <div className="flex gap-4">
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Articles
                  </Link>
                  <Link
                    to="/editor"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Editor
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </nav>
      )}
      <Outlet />
    </>
  );
}
