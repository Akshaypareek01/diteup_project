import { FSSAI_LICENSE_NO } from "@/lib/brand-contact";

export type EnergyBiteFaqItem = {
  question: string;
  answer: string;
};

/** Full Energy Bite FAQ copy from DITEUP _ POLICIES.docx. */
export const ENERGY_BITE_FAQ_ITEMS: EnergyBiteFaqItem[] = [
  {
    question: "What is DiteUp Energy Bite?",
    answer:
      "DiteUp Energy Bite is a pre-portioned soaked breakfast pack made for busy mornings. It contains 15 mini sachets that you can soak at night and eat fresh in the morning.",
  },
  {
    question: "How do I use DiteUp Energy Bite?",
    answer:
      "Open one mini pouch, add water, soak it overnight and eat it in the morning. It is designed to make your morning breakfast routine simple and hassle-free.",
  },
  {
    question: "How long should I soak it?",
    answer:
      "For best texture and taste, soak it overnight. You can soak it before sleeping and consume it the next morning.",
  },
  {
    question: "How many sachets are inside one DiteUp Energy Bite pack?",
    answer: "One DiteUp Energy Bite pack contains 15 pre-portioned mini sachets.",
  },
  {
    question: "What is the weight of one mini sachet?",
    answer: "Each mini sachet contains 50g of Energy Bite mix.",
  },
  {
    question: "What is the total net weight?",
    answer: "The total net weight is 750g.",
  },
  {
    question: "What ingredients are used in DiteUp Energy Bite?",
    answer:
      "DiteUp Energy Bite contains: Chana, Moong, Peanut, Cashew, Almond, Raisin, Pumpkin Seeds and Sunflower Seeds.",
  },
  {
    question: "Is DiteUp Energy Bite vegetarian?",
    answer: "Yes, DiteUp Energy Bite is a vegetarian product.",
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
    question: "Is it high in protein?",
    answer:
      "Yes, DiteUp Energy Bite is made with protein-rich ingredients like chana, moong, peanuts, almonds, cashews and seeds.",
  },
  {
    question: "Is it rich in fiber?",
    answer: "Yes, it contains fiber-rich ingredients like chana, moong, seeds and nuts.",
  },
  {
    question: "Is bowl and spoon included?",
    answer: "Yes, DiteUp Energy Bite comes with a free bowl and spoon.",
  },
  {
    question: "Is it ready to eat?",
    answer: "It is ready to eat after soaking. Just soak it at night and eat it in the morning.",
  },
  {
    question: "Can I eat it without soaking?",
    answer:
      "We recommend soaking it overnight for better texture, taste and eating experience.",
  },
  {
    question: "Can students use it?",
    answer:
      "Yes, it is suitable for students looking for a quick and simple breakfast option before classes.",
  },
  {
    question: "Is it suitable for gym and fitness users?",
    answer:
      "Yes, it can be used by gym and fitness users as a clean breakfast or pre-workout meal option, depending on their diet routine.",
  },
  {
    question: "Is it suitable for office workers?",
    answer:
      "Yes, it is made for busy mornings and can help office workers avoid the hassle of daily breakfast preparation.",
  },
  {
    question: "Is it suitable for kids?",
    answer:
      "It contains nuts and seeds. For kids, parents should check the ingredients carefully and decide based on the child's age, chewing ability and allergy history.",
  },
  {
    question: "Does it contain nuts?",
    answer:
      "Yes. It contains peanuts, almonds and cashews. People with nut allergies should not consume it without checking with a healthcare professional.",
  },
  {
    question: "How should I store it?",
    answer: "Store it in a cool, dry place. Keep it away from direct sunlight and moisture.",
  },
  {
    question: "What is the shelf life?",
    answer:
      "Please check the product label for the final shelf life, manufacturing date and best-before date.",
  },
  {
    question: "Is shipping free?",
    answer:
      "Yes, DiteUp offers free shipping on Energy Bite orders, unless mentioned otherwise at checkout.",
  },
  {
    question: "What is the price of DiteUp Energy Bite?",
    answer: "The MRP is ₹1099 and the current selling price is ₹799.",
  },
  {
    question: "Can I return the product?",
    answer:
      "Since this is a food product, returns are not accepted once the product is opened, used or consumed.",
  },
  {
    question: "What should I do if I receive a damaged product?",
    answer:
      "Please contact us within 48 hours of delivery with your order ID, product photos, packaging photos and unboxing video if available.",
  },
  {
    question: "Is DiteUp Energy Bite FSSAI certified?",
    answer: `Yes, DiteUp Energy Bite is FSSAI licensed. FSSAI Lic. No.: ${FSSAI_LICENSE_NO}`,
  },
];

const MAIN_HOME_FAQ_QUESTIONS = [
  "What is DiteUp Energy Bite?",
  "How do I use DiteUp Energy Bite?",
  "How long should I soak it?",
  "How many sachets are inside one DiteUp Energy Bite pack?",
  "Is DiteUp Energy Bite vegetarian?",
  "Does it contain added sugar?",
  "Does it contain preservatives?",
  "Is bowl and spoon included?",
  "How should I store it?",
  "Can I return the product?",
] as const;

/** Number of FAQs shown on the home page preview. */
export const HOME_FAQ_PREVIEW_COUNT = 3;

/**
 * Curated homepage FAQ subset labeled "Main FAQ" in DITEUP _ POLICIES.docx.
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
