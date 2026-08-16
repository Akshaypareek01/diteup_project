/** One homepage hero slide from `GET /v1/site/banners` / admin `homepageBanners`. */
export type HomepageBannerSlide = {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  href: string;
  alt: string;
  order: number;
};

export type HomepageBannersPayload = {
  slides: HomepageBannerSlide[];
};
