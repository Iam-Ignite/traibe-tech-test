import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useSearchParams } from "@remix-run/react";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { prisma } from "~/lib/db.server";
import { formatDate, getRelativeTime } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";

  const articles = await prisma.article.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(filter !== "all" && { category: filter }),
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      children: {
        select: {
          id: true,
        },
      },
    },
  });

  const categories = await prisma.article.findMany({
    distinct: ["category"],
    select: {
      category: true,
    },
  });

  return json({ articles, categories: categories.map((c: { category: any; }) => c.category) });
}

export default function Index() {
  const { articles, categories } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Articles</h1>
            <Link
              to="/articles/new"
              className="btn-primary"
            >
              + New Article
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Form method="get" className="flex-1">
              <input
                type="search"
                name="search"
                placeholder="Filter by title or category..."
                defaultValue={searchParams.get("search") || ""}
                className="input-field"
              />
            </Form>

            <div className="flex gap-2 flex-wrap">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </Link>
              {categories.map((cat:any) => (
                <Link
                  key={cat}
                  to={`/?filter=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentFilter === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No articles found. <Link to="/articles/new" className="text-blue-600 hover:underline">Create your first article</Link>
                    </td>
                  </tr>
                ) : (
                  articles.map((article: { id: Key | null | undefined; title: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; children: string | any[]; category: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; createdAt: string | Date; updatedAt: string | Date; }) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            to={`/articles/${article.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {article.title}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {article.children.length > 0 && `${article.children.length} child article${article.children.length > 1 ? "s" : ""}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(article.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getRelativeTime(article.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <Link
                          to={`/editor?article=${article.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <Form method="post" action={`/articles/${article.id}/delete`} className="inline">
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900"
                            onClick={(e) => {
                              if (!confirm("Are you sure you want to delete this article?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </Form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          {articles.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{articles.length}</span> article{articles.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
