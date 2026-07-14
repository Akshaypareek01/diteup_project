import Image from "next/image";

/**
 * Full-width "Perfect for every you" marketing banner — artwork includes headline and persona tiles.
 */
export function PerfectForEveryYouSection() {
  return (
    <section
      id="perfect-for-you"
      className="scroll-mt-[104px] border-b border-line/60 bg-[#FDFBF7]"
      aria-label="Perfect for every you — healthy breakfast for every lifestyle"
    >
      <div className="mx-auto w-full">
        <Image
          src="/assets/Images/perfectforyou.png"
          alt="Perfect for every you — DiteUp Energy Bite for students, gym and fitness, office workers, busy moms, and healthy lifestyle"
          width={1672}
          height={941}
          sizes="100vw"
          className="h-auto w-full object-contain object-center"
        />
      </div>
    </section>
  );
}
