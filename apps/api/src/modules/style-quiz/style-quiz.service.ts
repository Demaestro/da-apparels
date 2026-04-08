import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../lib/prisma.service";
import type { SubmitQuizDto } from "./dto/submit-quiz.dto";
import { ProductStatus } from "@prisma/client";

// Static quiz questions — extend as needed
const QUIZ_QUESTIONS = [
  {
    id: "body_type",
    question: "Which silhouette best describes your body shape?",
    options: [
      { value: "HOURGLASS", label: "Hourglass", description: "Shoulders and hips roughly the same width with a defined waist." },
      { value: "PEAR", label: "Pear", description: "Hips wider than shoulders." },
      { value: "APPLE", label: "Apple", description: "Fuller around the midsection." },
      { value: "RECTANGLE", label: "Rectangle", description: "Shoulders, waist, and hips similar in width." },
      { value: "INVERTED_TRIANGLE", label: "Inverted Triangle", description: "Shoulders notably wider than hips." },
    ],
  },
  {
    id: "style",
    question: "Which styles resonate with you most? (Select all that apply)",
    multiSelect: true,
    options: [
      { value: "minimalist", label: "Minimalist" },
      { value: "formal", label: "Formal & Corporate" },
      { value: "afrocentric", label: "Afrocentric" },
      { value: "streetwear", label: "Contemporary Streetwear" },
      { value: "gala", label: "Red Carpet / Gala" },
      { value: "casual_luxury", label: "Casual Luxury" },
      { value: "bridal", label: "Bridal / Ceremonial" },
      { value: "resort", label: "Resort / Vacation" },
    ],
  },
  {
    id: "occasions",
    question: "What occasions do you dress for most often?",
    multiSelect: true,
    options: [
      { value: "office", label: "Office / Work" },
      { value: "wedding", label: "Weddings & Events" },
      { value: "gala", label: "Galas & Award Nights" },
      { value: "casual", label: "Casual Outings" },
      { value: "date_night", label: "Date Night" },
      { value: "travel", label: "Travel" },
    ],
  },
];

@Injectable()
export class StyleQuizService {
  constructor(private prisma: PrismaService) {}

  getQuestions() {
    return QUIZ_QUESTIONS;
  }

  async submit(userId: string, dto: SubmitQuizDto) {
    // Scoring: tag products by style alignment weight
    const matchedProducts = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        tags: { some: { tag: { in: dto.preferredStyles } } },
      },
      select: { id: true, slug: true, name: true, tags: { select: { tag: true } } },
    });

    // Score each product by how many preferred styles it matches
    const scored = matchedProducts
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        score: p.tags.filter((t) => dto.preferredStyles.includes(t.tag)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const matchPayload = { topMatches: scored.map((s) => s.id), scoredAt: new Date() };

    const result = await this.prisma.styleQuizResult.upsert({
      where: { userId },
      create: {
        userId,
        bodyType: dto.bodyType,
        preferredColors: dto.preferredColors,
        preferredStyles: dto.preferredStyles,
        occasions: dto.occasions,
        matchPayload,
      },
      update: {
        bodyType: dto.bodyType,
        preferredColors: dto.preferredColors,
        preferredStyles: dto.preferredStyles,
        occasions: dto.occasions,
        matchPayload,
        takenAt: new Date(),
      },
    });

    return { result, topMatches: scored.slice(0, 8) };
  }

  async getResult(userId: string) {
    return this.prisma.styleQuizResult.findUnique({ where: { userId } });
  }
}
