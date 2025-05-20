import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import DataRow from '../Box/data/dataRow';
import {
  TimelineContainer,
  TimelineItem,
  TimelineContent,
  TimelineImageContainer,
  TimelineDot,
  TimelineLine,
  TimelineHeader,
} from '../../styles/components/Timeline.styles';

const AboutTimeline = () => {
  const timelineData = DataRow();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const lineRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const elementsToObserve = [];
    if (headerRef.current) elementsToObserve.push(headerRef.current);
    if (lineRef.current) elementsToObserve.push(lineRef.current);
    containerRef.current?.querySelectorAll('.timeline-item-observer').forEach(item => elementsToObserve.push(item));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
          }
        });
      },
      { threshold: 0.2 }
    );

    elementsToObserve.forEach(el => observer.observe(el));

    return () => {
      elementsToObserve.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <TimelineContainer ref={containerRef}>
      <TimelineHeader ref={headerRef}>
        <span>{t("aboutUsTitle", "About Us")}</span>
      </TimelineHeader>
      <TimelineLine ref={lineRef} />
      {timelineData.map((item, index) => {
        const isLeft = index % 2 === 0;
        const content = (
          <TimelineContent className="text-content">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </TimelineContent>
        );
        const image = (
          <TimelineImageContainer className="image-content">
            <Image
              src={item.expandableImage}
              alt={item.title || 'Timeline image'}
              width={300}
              height={200}
              style={{ objectFit: 'cover', borderRadius: '8px', display: 'block' }}
            />
          </TimelineImageContainer>
        );

        return (
          <TimelineItem
            key={item.id}
            className={`${isLeft ? 'left' : 'right'} timeline-item-observer`}
          >
            <TimelineDot />
            {isLeft ? image : content}
            {isLeft ? content : image}
          </TimelineItem>
        );
      })}
    </TimelineContainer>
  );
};

export default AboutTimeline; 