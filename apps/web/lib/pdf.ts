import jsPDF from "jspdf";
import type { WeeklyPlanRecipe } from "@/lib/types";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function sanitize(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(sanitize(text), maxWidth);
  for (const line of lines) {
    if (y > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function generateRecipePdf(recipe: WeeklyPlanRecipe): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  y = addWrappedText(doc, sanitize(recipe.title), MARGIN, y, CONTENT_WIDTH, 8);
  y += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${recipe.servings} portioner  |  ${recipe.sourceUrl}`, MARGIN, y);
  doc.setTextColor(0);
  y += 8;

  // Ingredienser
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  y = ensureSpace(doc, y, 10);
  doc.text("Ingredienser", MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const ing of recipe.ingredients) {
    y = ensureSpace(doc, y, 6);
    y = addWrappedText(doc, `\u2022  ${sanitize(ing)}`, MARGIN + 2, y, CONTENT_WIDTH - 4, 5);
    y += 1;
  }
  y += 4;

  // Fremgangsmåde
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  y = ensureSpace(doc, y, 10);
  doc.text("Fremgangsmåde", MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  recipe.directions.forEach((dir, i) => {
    y = ensureSpace(doc, y, 8);
    y = addWrappedText(doc, `${i + 1}.  ${sanitize(dir)}`, MARGIN + 2, y, CONTENT_WIDTH - 4, 5);
    y += 2;
  });

  doc.save(`${recipe.title.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, "").trim()}.pdf`);
}

export function generateAllRecipesPdf(recipes: WeeklyPlanRecipe[]): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  recipes.forEach((recipe, recipeIndex) => {
    if (recipeIndex > 0) doc.addPage();
    let y = MARGIN;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    y = addWrappedText(doc, sanitize(recipe.title), MARGIN, y, CONTENT_WIDTH, 8);
    y += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${recipe.servings} portioner  |  ${recipe.sourceUrl}`, MARGIN, y);
    doc.setTextColor(0);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ingredienser", MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const ing of recipe.ingredients) {
      y = ensureSpace(doc, y, 6);
      y = addWrappedText(doc, `\u2022  ${sanitize(ing)}`, MARGIN + 2, y, CONTENT_WIDTH - 4, 5);
      y += 1;
    }
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    y = ensureSpace(doc, y, 10);
    doc.text("Fremgangsmåde", MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    recipe.directions.forEach((dir, i) => {
      y = ensureSpace(doc, y, 8);
      y = addWrappedText(doc, `${i + 1}.  ${sanitize(dir)}`, MARGIN + 2, y, CONTENT_WIDTH - 4, 5);
      y += 2;
    });
  });

  doc.save("Ugens opskrifter.pdf");
}

export function generateShoppingListPdf(
  items: { name: string; quantity: string | null }[]
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Indkøbsliste", MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const item of items) {
    y = ensureSpace(doc, y, 7);
    const label = item.quantity
      ? `\u2610  ${sanitize(item.name)}  (${sanitize(item.quantity)})`
      : `\u2610  ${sanitize(item.name)}`;
    y = addWrappedText(doc, label, MARGIN, y, CONTENT_WIDTH, 5.5);
    y += 2;
  }

  doc.save("Indkøbsliste.pdf");
}

export async function generateHtmlPdf(html: string, filename: string): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.width = "800px";
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
