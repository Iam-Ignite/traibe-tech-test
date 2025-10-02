import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { generateSlug } from "~/lib/utils";
import { useState, useEffect } from "react";
// Define Article type if not exported from @prisma/client
type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Types
type ArticleWithChildren = Article & {
  children: Article[];
};

type CategoryTree = {
  category: string;
  articles: ArticleWithChildren[];
};

type ActionResponse =
  | { error: string }
  | { success: true; article: Article };

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const articleId = url.searchParams.get("article");

  const articles = await prisma.article.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: {
      children: { orderBy: { title: "asc" } },
    },
  });

  // Group articles by category
  const categoryMap = new Map<string, ArticleWithChildren[]>();

  articles.forEach((article: ArticleWithChildren) => {
    if (!categoryMap.has(article.category)) {
      categoryMap.set(article.category, []);
    }
    // Only include root-level articles
    if (!article.parentId) {
      categoryMap.get(article.category)!.push(article);
    }
  });

  const tree: CategoryTree[] = Array.from(categoryMap.entries()).map(
    ([category, articles]) => ({ category, articles })
  );

  const currentArticle = articleId
    ? await prisma.article.findUnique({ where: { id: articleId } })
    : null;

  return json({ tree, currentArticle });
}

// Action
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const category = formData.get("category")?.toString();
  const content = formData.get("content")?.toString();
  const parentId = formData.get("parentId")?.toString() || null;

  if (!title || !category || !content) {
    return json<ActionResponse>(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const slug = generateSlug(title);

  if (id) {
    // Update existing article
    const existing = await prisma.article.findFirst({
      where: { slug, NOT: { id } },
    });

    if (existing) {
      return json<ActionResponse>(
        { error: "An article with this title already exists" },
        { status: 400 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: { title, slug, category, content, parentId },
    });

    return json<ActionResponse>({ success: true, article });
  } else {
    // Create new article
    const existing = await prisma.article.findUnique({ where: { slug } });

    if (existing) {
      return json<ActionResponse>(
        { error: "An article with this title already exists" },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: { title, slug, category, content, parentId },
    });

    return redirect(`/editor?article=${article.id}`);
  }
}

// Helper Components
function TreeCategory({
  category,
  articles,
  currentArticleId,
  isExpanded,
  onToggle,
}: {
  category: string;
  articles: SerializeFrom<ArticleWithChildren>[];
  currentArticleId?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{category}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="bg-white">
          {articles.map((article) => (
            <div key={article.id}>
              <Link
                to={`/editor?article=${article.id}`}
                className={`block px-4 py-2 pl-8 text-sm hover:bg-blue-50 ${
                  currentArticleId === article.id
                    ? "bg-blue-100 text-blue-900 font-medium"
                    : "text-gray-700"
                }`}
              >
                📄 {article.title}
              </Link>

              {article.children.length > 0 && (
                <div className="bg-gray-50">
                  {article.children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/editor?article=${child.id}`}
                      className={`block px-4 py-2 pl-12 text-sm hover:bg-blue-50 ${
                        currentArticleId === child.id
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      ↳ {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertMessage({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  return (
    <div className={`mb-6 p-4 border rounded-lg ${styles[type]}`}>
      <p>{message}</p>
    </div>
  );
}

// Main Component
export default function Editor() {
  const { tree, currentArticle } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    id: currentArticle?.id || "",
    title: currentArticle?.title || "",
    category: currentArticle?.category || "",
    content: currentArticle?.content || "",
    parentId: currentArticle?.parentId || "",
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";

  // Update form when article changes
  useEffect(() => {
    if (currentArticle) {
      setFormData({
        id: currentArticle.id,
        title: currentArticle.title,
        category: currentArticle.category,
        content: currentArticle.content,
        parentId: currentArticle.parentId || "",
      });
    }
  }, [currentArticle]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Article Editor</h1>
            <Link to="/" className="btn-secondary text-sm">
              ← Back to List
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Tree View Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
              <Link
                to="/articles/new"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + New
              </Link>
            </div>

            <div className="space-y-2">
              {tree.map(({ category, articles }) => (
                <TreeCategory
                  key={category}
                  category={category}
                  articles={articles}
                  currentArticleId={currentArticle?.id}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Editor Panel */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <Form
              method="post"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
            >
              {/* Alert Messages */}
              {actionData && "error" in actionData && (
                <AlertMessage type="error" message={actionData.error} />
              )}

              {actionData && "success" in actionData && (
                <AlertMessage
                  type="success"
                  message="Article saved successfully!"
                />
              )}

              <input type="hidden" name="id" value={formData.id} />

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="input-field"
                    placeholder="Enter article title"
                  />
                  {formData.title && (
                    <p className="mt-2 text-sm text-gray-500">
                      Slug:{" "}
                      <span className="font-mono">
                        {generateSlug(formData.title)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category *
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="input-field"
                    placeholder="e.g., Technology, Education, Design"
                  />
                </div>

                {/* Parent Article */}
                <div>
                  <label
                    htmlFor="parentId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Parent Article (Optional)
                  </label>
                  <select
                    id="parentId"
                    name="parentId"
                    value={formData.parentId}
                    onChange={(e) => updateField("parentId", e.target.value)}
                    className="input-field"
                  >
                    <option value="">None (Root Article)</option>
                    {tree.map(({ category, articles }) =>
                      articles.map((article) => (
                        <option
                          key={article.id}
                          value={article.id}
                          disabled={article.id === formData.id}
                        >
                          {category} → {article.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Content *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={16}
                    value={formData.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="input-field font-mono text-sm"
                    placeholder="Write your article content here..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    {currentArticle && (
                      <Link
                        to={`/articles/${currentArticle.id}`}
                        className="btn-secondary"
                      >
                        Preview
                      </Link>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {formData.id ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>{formData.id ? "Save Changes" : "Create Article"}</>
                    )}
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {formData.id ? "Saving Changes..." : "Creating Article..."}
            </h3>
            <p className="text-sm text-gray-600">Please wait while we save your article</p>
          </div>
        </div>
      )}
    </div>
  );
}
