import React, { useEffect, useRef, useState } from 'react';
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
  // Estado para controlar la visibilidad de los elementos
  const [isVisible, setIsVisible] = useState({
    header: false,
    line: false,
    items: Array(timelineData.length).fill(false)
  });

  useEffect(() => {
    // Función para marcar elementos como visibles
    const handleElementVisible = (elementId, index = null) => {
      setIsVisible(prev => {
        if (elementId === 'item' && index !== null) {
          const newItems = [...prev.items];
          newItems[index] = true;
          return { ...prev, items: newItems };
        }
        return { ...prev, [elementId]: true };
      });
    };

    // Configurar observadores
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Identificar qué elemento es
            if (entry.target === headerRef.current) {
              handleElementVisible('header');
            } else if (entry.target === lineRef.current) {
              handleElementVisible('line');
            } else if (entry.target.classList.contains('timeline-item-observer')) {
              const index = parseInt(entry.target.dataset.index, 10);
              if (!isNaN(index)) {
                handleElementVisible('item', index);
              }
            }
            // Dejar de observar el elemento
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    // Observar elementos
    if (headerRef.current) observer.observe(headerRef.current);
    if (lineRef.current) observer.observe(lineRef.current);
    
    // Observar items de la línea de tiempo
    const itemElements = containerRef.current?.querySelectorAll('.timeline-item-observer');
    itemElements?.forEach(item => observer.observe(item));

    return () => {
      // Limpieza al desmontar
      if (observer) {
        if (headerRef.current) observer.unobserve(headerRef.current);
        if (lineRef.current) observer.unobserve(lineRef.current);
        itemElements?.forEach(item => observer.unobserve(item));
        observer.disconnect();
      }
    };
  }, [timelineData.length]);

  return (
    <TimelineContainer ref={containerRef}>
      <TimelineHeader ref={headerRef} className={isVisible.header ? 'visible' : ''}>
        <span>{t("aboutUsTitle", "About Us")}</span>
      </TimelineHeader>
      <TimelineLine ref={lineRef} className={isVisible.line ? 'visible' : ''} />
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
            className={`${isLeft ? 'left' : 'right'} timeline-item-observer ${isVisible.items[index] ? 'visible' : ''}`}
            data-index={index}
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