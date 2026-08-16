import { FSSAI_LICENSE_NO } from "@/lib/brand-contact";

export type EnergyBiteFaqItem = {
  question: string;
  answer: string;
};

/** Full Energy Bite FAQ copy shown on the PDP accordion and `/faq`. */
export const ENERGY_BITE_FAQ_ITEMS: EnergyBiteFaqItem[] = [
  {
    question: "What is DiteUp Energy Bite?",
    answer:
      "DiteUp Energy Bite is a pre-portioned soaked breakfast pack made for busy mornings. It contains 15 mini sachets that you can soak at night and eat in the morning.",
  },
  {
    question: "How many sachets are inside one pack?",
    answer: "One DiteUp Energy Bite pack contains 15 mini sachets.",
  },
  {
    question: "What is the weight of one sachet?",
    answer: "Each mini sachet contains 50g of Energy Bite mix.",
  },
  {
    question: "What is the total net weight?",
    answer: "The total net weight is 750g.",
  },
  {
    question: "How do I use it?",
    answer:
      "Open one mini sachet, pour it into the bowl, add clean drinking water, soak it overnight and eat it in the morning.",
  },
  {
    question: "Can I eat it without soaking?",
    answer:
      "We recommend soaking it overnight for better texture, taste and eating experience.",
  },
  {
    question: "Is bowl and spoon included?",
    answer: "Yes, a free bowl and spoon are included inside the pack.",
  },
  {
    question: "Does it contain added sugar?",
    answer: "No, DiteUp Energy Bite has no added sugar.",
  },
  {
    question: "Does it contain preservatives?",
    answer: "No, DiteUp Energy Bite has no added preservatives.",
  },
  {
    question: "Does it contain additives?",
    answer: "No, DiteUp Energy Bite has no added additives.",
  },
  {
    question: "Is it vegetarian?",
    answer: "Yes, DiteUp Energy Bite is a vegetarian product.",
  },
  {
    question: "What ingredients are used?",
    answer:
      "It contains chana, moong, peanut, cashew, almond, raisin, pumpkin seeds and sunflower seeds.",
  },
  {
    question: "Is it suitable for gym users?",
    answer:
      "Yes, it can be used by gym and fitness users as a breakfast or pre-workout meal option depending on their diet routine.",
  },
  {
    question: "Is it suitable for students?",
    answer: "Yes, it is suitable for students who want a quick and simple breakfast routine.",
  },
  {
    question: "Does it contain nuts?",
    answer:
      "Yes, it contains peanuts, almonds and cashews. People with nut allergies should avoid it or consult a healthcare professional before use.",
  },
  {
    question: "How should I store it?",
    answer: "Store in a cool, dry place. Keep away from direct sunlight and moisture.",
  },
  {
    question: "What is the price?",
    answer: "The MRP is ₹1099 and the current selling price is ₹799.",
  },
  {
    question: "Is shipping free?",
    answer: "Yes, free shipping is available unless mentioned otherwise at checkout.",
  },
  {
    question: "Can I return it?",
    answer:
      "Since this is a food product, returns are not accepted once the product is opened, used or consumed.",
  },
  {
    question: "What is the FSSAI number?",
    answer: `FSSAI Lic. No.: ${FSSAI_LICENSE_NO}`,
  },
];

const MAIN_HOME_FAQ_QUESTIONS = [
  "What is DiteUp Energy Bite?",
  "How do I use it?",
  "How many sachets are inside one pack?",
  "Is it vegetarian?",
  "Does it contain added sugar?",
  "Does it contain preservatives?",
  "Is bowl and spoon included?",
  "How should I store it?",
  "Is shipping free?",
  "Can I return it?",
] as const;

/** Number of FAQs shown on the home page preview. */
export const HOME_FAQ_PREVIEW_COUNT = 3;

/**
 * Curated homepage FAQ subset labeled "Main FAQ".
 */
export function getMainHomeFaqItems(): EnergyBiteFaqItem[] {
  const byQuestion = new Map(ENERGY_BITE_FAQ_ITEMS.map((item) => [item.question, item]));
  return MAIN_HOME_FAQ_QUESTIONS.map((question) => {
    const item = byQuestion.get(question);
    if (!item) {
      throw new Error(`Missing homepage FAQ copy for: ${question}`);
    }
    return item;
  });
}

/**
 * First N curated homepage FAQs for the home preview block.
 */
export function getHomePreviewFaqItems(): EnergyBiteFaqItem[] {
  return getMainHomeFaqItems().slice(0, HOME_FAQ_PREVIEW_COUNT);
}
