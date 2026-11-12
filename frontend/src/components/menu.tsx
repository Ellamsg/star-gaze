import { formatNaira, menu } from "@/data/site";

export function Menu() {
  return (
    <section
      id="menu"
      className="mx-auto w-full max-w-[1500px] px-5 pb-4 pt-2 sm:px-8"
    >
      <div className="rounded-[30px] bg-rose p-5 sm:p-8 lg:p-10">
        <h2 className="font-display text-[clamp(2.75rem,6.5vw,6rem)] uppercase leading-none text-cream">
          The Menu
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8">
          {menu.map((group) => (
            <div
              key={group.category}
              className="rounded-[24px] bg-canvas p-5 sm:p-7"
            >
              <h3 className="font-serif text-[27px] italic leading-none text-pink lg:text-[31px]">
                {group.category}
              </h3>

              <ul className="mt-6 flex flex-col gap-5">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 text-[14px] leading-snug sm:text-[15px]"
                  >
                    <p className="text-cream">
                      {item.name}
                      <span className="text-muted"> · {item.duration}</span>
                    </p>
                    <p className="whitespace-nowrap font-semibold tabular-nums text-cream">
                      {formatNaira(item.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
