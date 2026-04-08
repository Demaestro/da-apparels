import type { Metadata } from "next";
import { ArTryOnClient } from "./ar-tryon-client";

export const metadata: Metadata = {
  title: "AR Try-On",
  description: "See DA Apparel pieces on you before you order, using Augmented Reality.",
};

export default function ArTryOnPage() {
  return <ArTryOnClient />;
}
