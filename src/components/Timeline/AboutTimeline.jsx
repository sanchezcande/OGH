import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import DataRow from "../Box/data/dataRow";
import {
  TimelineWrapper,
  TimelineItem,
  TimelineImageSide,
  TimelineTextSide,
} from "../../styles/components/Timeline.styles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LABELS = ["History", "Mission", "Technology", "Innovation"];

const AboutTimeline = () => {
  const timelineData = DataRow();
  const { t } = useTranslation();
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    let ctx;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const items = wrapperRef.current.querySelectorAll(".tl-item");

        items.forEach((item, index) => {
          const imgSide = item.querySelector(".tl-img");
          const img = item.querySelector(".tl-img img");
          const corner = item.querySelector(".corner-mark");
          const textSide = item.querySelector(".tl-text");
          const label = item.querySelector(".item-label");
          const title = item.querySelector("h3");
          const line = item.querySelector(".item-line");
          const desc = item.querySelector(".tl-desc");
          const isEven = index % 2 !== 0;

          // -- Initial states --
          gsap.set(imgSide, { opacity: 0, yPercent: 8 });
          gsap.set(textSide, { opacity: 0, yPercent: 8 });
          if (img) {
            gsap.set(img, {
              filter: "grayscale(100%) contrast(1.2) brightness(0.85)",
              scale: 1.15,
            });
          }

          // -- IMAGE SIDE: scroll-driven fade + rise (scrub) --
          gsap.to(imgSide, {
            opacity: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              end: "top 55%",
              scrub: 0.4,
            },
          });

          // -- PARALLAX on img --
          if (img) {
            gsap.fromTo(
              img,
              { yPercent: -12 },
              {
                yPercent: 12,
                ease: "none",
                scrollTrigger: {
                  trigger: item,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              }
            );

            // -- B&W → COLOR + scale down on scroll --
            gsap.to(img, {
              filter: "grayscale(0%) contrast(1) brightness(1)",
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 55%",
                end: "top 5%",
                scrub: 0.6,
              },
            });
          }

          // -- CORNER MARK --
          if (corner) {
            gsap.to(corner, {
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 50%",
                end: "top 35%",
                scrub: 0.4,
              },
            });
          }

          // -- TEXT SIDE: scroll-driven fade + rise (scrub, slight delay) --
          gsap.to(textSide, {
            opacity: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              end: "top 50%",
              scrub: 0.4,
            },
          });

          // -- TEXT CONTENT: scroll-driven stagger reveal --
          const textTl = gsap.timeline({
            scrollTrigger: {
              trigger: item,
              start: "top 60%",
              end: "top 25%",
              scrub: 0.5,
            },
          });

          textTl
            .fromTo(label, { opacity: 0 }, { opacity: 1 }, 0)
            .fromTo(title, { opacity: 0, y: 15 }, { opacity: 1, y: 0 }, 0.05)
            .fromTo(line, { scaleX: 0 }, { scaleX: 1 }, 0.15)
            .fromTo(desc, { opacity: 0, y: 10 }, { opacity: 1, y: 0 }, 0.25);
        });

        ScrollTrigger.refresh();
      }, wrapperRef);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <TimelineWrapper ref={wrapperRef}>
      {timelineData.map((item, index) => (
        <TimelineItem key={item.id} className="tl-item">
          <TimelineImageSide className="tl-img">
            <Image
              src={item.expandableImage}
              alt={typeof item.title === "string" ? item.title : "Timeline"}
              width={700}
              height={550}
              quality={90}
              style={{ objectFit: "cover" }}
            />
            <div className="corner-mark" />
            <span className="item-number">
              {String(index + 1).padStart(2, "0")}
            </span>
          </TimelineImageSide>

          <TimelineTextSide className="tl-text">
            <span className="item-label">{LABELS[index]}</span>
            <h3>{item.title}</h3>
            <div className="item-line" />
            <p className="tl-desc">{item.description}</p>
          </TimelineTextSide>
        </TimelineItem>
      ))}
    </TimelineWrapper>
  );
};

export default AboutTimeline;
