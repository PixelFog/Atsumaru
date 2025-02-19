import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MangaInfo, ProgressInfo } from "../../types";
import Header from "../header/Header";
import Poster from "../poster/Poster";
import classes from "./carousel.module.scss";
import cm from "../../utils/classMerger";
import { Link, useNavigate } from "react-router-dom";
import resolveVendorSlug from "../../utils/resolveVendorSlug";
import Swiper, { Navigation, Pagination, Scrollbar, A11y } from "swiper";
import {
  Swiper as SwiperComponent,
  SwiperSlide,
  useSwiper,
} from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import useMedia from "../../hooks/useMedia";
import { resolvePageUrlParameter } from "../../pages/read/helpers";
import Icon from "../icon/Icon";
import Button from "../button/Button";
import getLatestProgress from "../../utils/getLatestProgress";

export type GenericItem = {
  header: string;
  key: string;
  items: {
    manga: MangaInfo;
    progress: undefined;
  }[];
  type: "GENERIC_ITEM" | "PROGRESS_ITEM";
};

export type ProgressItem = Omit<GenericItem, "items"> & {
  type: "PROGRESS_ITEM";
  items: {
    manga: MangaInfo;
    progress: ProgressInfo;
  }[];
};

type Props = {
  item: GenericItem | ProgressItem;
};

const CarouselContext = createContext<{
  swiper?: [
    Swiper | undefined,
    React.Dispatch<React.SetStateAction<Swiper | undefined>>,
  ];
}>({});

export default function Carousel(props: Props) {
  const { item } = props;
  const swiper = useState<Swiper>();
  const mobile = useMedia(
    ["(pointer: coarse)", "(pointer: fine)"],
    [true, false],
    false,
  );

  /* const ref = useRef(null); */
  /* const { onMouseDown } = useDraggableScroll(ref); */

  return (
    <>
      <CarouselContext.Provider value={{ swiper }}>
        <div className={classes.carousel}>
          <CarouselHeader item={item} />
          <div className={cm(classes.content)}>
            {mobile ? (
              item.items.map(({ manga, progress }) => (
                <Item key={manga.slug} progress={progress} manga={manga} />
              ))
            ) : (
              <Desktop layout={item} />
            )}
          </div>
        </div>
      </CarouselContext.Provider>
    </>
  );
}

function CarouselHeader({ item }: { item: GenericItem | ProgressItem }) {
  const ctx = useContext(CarouselContext);
  const [swiper] = ctx.swiper ?? [];

  return (
    <Header level={1}>
      <div className={classes.header}>
        <div className={classes.title}>{item.header}</div>
        <div className={classes.controls}>
          <Button icon={<Icon scale={0.8} icon="reload" />} />
          <div className={classes.unit}>
            <Button
              onClick={() => swiper?.slidePrev()}
              icon={<Icon icon="chevron" orientation=".5turn" />}
            />
            <Button
              onClick={() => swiper?.slideNext()}
              icon={<Icon icon="chevron" />}
            />
          </div>
          <Button
            hoverReveal
            iconLoc="right"
            icon={<Icon icon="arrow" orientation=".25turn" />}>
            View all
          </Button>
        </div>
        <div className={classes.mobileControls}>
          <Link to="#">
            View all <Icon icon="arrow" orientation=".25turn" />
          </Link>
        </div>
      </div>
    </Header>
  );
}

function Desktop({ layout }: { layout: GenericItem | ProgressItem }) {
  const columns = useMedia(
    [
      "(min-width: 1400px)",
      "(min-width: 1000px)",
      "(min-width: 600px)",
      "(min-width: 0px)",
    ],
    [5, 4, 3, 2],
    5,
  );

  return (
    <div className={classes.desktop}>
      <SwiperComponent
        modules={[Pagination, Scrollbar, A11y]}
        spaceBetween={10}
        slidesPerView={columns}
        preventClicksPropagation={true}
        preventClicks={false}
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        onSlideChange={() => void 0}>
        {layout.items.map(({ manga, progress }) => (
          <SwiperSlide key={manga.slug}>
            <SwiperHook />
            <div className={classes.desktopInner}>
              <Item progress={progress} manga={manga} />
            </div>
          </SwiperSlide>
        ))}
      </SwiperComponent>
    </div>
  );
}

function SwiperHook() {
  const swiper = useSwiper();
  const ctx = useContext(CarouselContext);
  const [, setSwiper] = ctx.swiper ?? [];
  useEffect(() => {
    if (!swiper || !setSwiper) return;
    setSwiper(swiper);
  }, [swiper, setSwiper]);
  return <></>;
}

function Item({
  manga,
  progress,
}: {
  manga: MangaInfo;
  progress?: ProgressInfo;
}) {
  const navigate = useNavigate();
  const latestProgress = useMemo(
    () => progress && getLatestProgress(progress),
    [progress],
  );

  const url = useMemo(
    () =>
      progress && latestProgress
        ? `/read/${resolveVendorSlug(manga.vendor)}/${manga.slug}/${
            latestProgress.chapter
          }/${resolvePageUrlParameter(
            parseInt(latestProgress.meta.page) ?? 1,
            latestProgress.meta.progress,
          )}`
        : `/manga/${resolveVendorSlug(manga.vendor)}/${manga.slug}`,
    [manga, progress, latestProgress],
  );
  return (
    <Poster
      onClick={() => navigate(url)}
      label={manga.title}
      progress={
        progress && latestProgress
          ? {
              full: progress,
              latest: latestProgress,
            }
          : undefined
      }
      manga={manga}
    />
  );
  /* return (
        <Link
            style={{
                pointerEvents: "none",
            }}
            key={manga._id}
            to={`/manga/${resolveVendorSlug(manga.vendor)}/${manga.slug}`}
        >
            <Poster label={manga.title} manga={manga} />
        </Link>
    ); */
}
