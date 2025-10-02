import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { prisma } from "~/lib/db.server";
import { formatDate } from "~/lib/utils";

export async function loader({ params }: LoaderFunctionArgs) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      children: true,
      parent: true,
    },
  });

  if (!article) {
    throw new Response("Article not found", { status: 404 });
  }

  return json({ article });
}

export default function ArticleDetail() {
  const { article } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
              ← Back to Articles
            </Link>
            <Link
              to={`/editor?article=${article.id}`}
              className="btn-primary"
            >
              Edit Article
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="mb-4">
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {article.category}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Created: {formatDate(article.createdAt)}</span>
            <span>•</span>
            <span>Updated: {formatDate(article.updatedAt)}</span>
          </div>
          {article.parent && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Parent Article:{" "}
                <Link
                  to={`/articles/${article.parent.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {article.parent.title}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }}
            />
          </div>
        </div>

        {/* Child Articles */}
        {article.children.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Related Articles ({article.children.length})
            </h2>
            <div className="space-y-3">
              {article.children.map((child: { id: Key | null | undefined; title: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; category: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }) => (
                <Link
                  key={child.id}
                  to={`/articles/${child.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{child.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{child.category}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
