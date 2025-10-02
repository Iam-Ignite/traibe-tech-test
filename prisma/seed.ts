import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.article.deleteMany();

  // Create categories with articles
  const techParent = await prisma.article.create({
    data: {
      title: "Introduction to Web Development",
      slug: "introduction-to-web-development",
      category: "Technology",
      content: `# Introduction to Web Development

Web development is the work involved in developing websites for the Internet or an intranet. It can range from developing a simple single static page to complex web applications.

## Key Areas

1. Frontend Development
2. Backend Development
3. Full-Stack Development

Web development is an exciting field that combines creativity with technical skills.`,
    },
  });

  await prisma.article.create({
    data: {
      title: "JavaScript Fundamentals",
      slug: "javascript-fundamentals",
      category: "Technology",
      content: `# JavaScript Fundamentals

JavaScript is the programming language of the web. It allows you to add interactivity to your websites.

## Core Concepts

- Variables and Data Types
- Functions
- Objects and Arrays
- DOM Manipulation

Master these fundamentals to become proficient in web development.`,
      parentId: techParent.id,
    },
  });

  await prisma.article.create({
    data: {
      title: "React Getting Started",
      slug: "react-getting-started",
      category: "Technology",
      content: `# Getting Started with React

React is a popular JavaScript library for building user interfaces, particularly single-page applications.

## Why React?

- Component-based architecture
- Virtual DOM for performance
- Large ecosystem
- Strong community support

Start building modern web applications with React today!`,
      parentId: techParent.id,
    },
  });

  const eduParent = await prisma.article.create({
    data: {
      title: "Effective Learning Strategies",
      slug: "effective-learning-strategies",
      category: "Education",
      content: `# Effective Learning Strategies

Learning is a skill that can be improved with the right strategies and techniques.

## Key Strategies

1. Active Recall
2. Spaced Repetition
3. Interleaving
4. Elaboration

Apply these strategies to accelerate your learning journey.`,
    },
  });

  await prisma.article.create({
    data: {
      title: "Note-Taking Methods",
      slug: "note-taking-methods",
      category: "Education",
      content: `# Note-Taking Methods

Effective note-taking is crucial for retaining information and understanding complex topics.

## Popular Methods

- Cornell Method
- Mind Mapping
- Outline Method
- Zettelkasten

Find the method that works best for you!`,
      parentId: eduParent.id,
    },
  });

  await prisma.article.create({
    data: {
      title: "UI Design Principles",
      slug: "ui-design-principles",
      category: "Design",
      content: `# UI Design Principles

Great user interface design follows fundamental principles that make applications intuitive and enjoyable to use.

## Core Principles

1. Consistency
2. Hierarchy
3. White Space
4. Feedback
5. Accessibility

Apply these principles to create beautiful, functional interfaces.`,
    },
  });

  await prisma.article.create({
    data: {
      title: "Color Theory for Designers",
      slug: "color-theory-for-designers",
      category: "Design",
      content: `# Color Theory for Designers

Understanding color theory is essential for creating visually appealing designs that communicate effectively.

## Key Concepts

- Color Wheel
- Complementary Colors
- Color Psychology
- Contrast and Accessibility

Use color strategically to enhance your designs.`,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("📊 Created:");
  console.log("  - 7 articles");
  console.log("  - 3 categories (Technology, Education, Design)");
  console.log("  - 3 parent-child relationships");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
