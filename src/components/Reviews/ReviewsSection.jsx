import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import {
  ReviewsContainer,
  ReviewsCarousel,
  ReviewsTrack,
  CarouselButton
} from "../../styles/components/Reviews.styles";
import { SectionTitle } from "../../styles/pagesStyles/HomePages.styles";

export const ReviewsSection = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const reviews = ["skylar", "techvision", "greenleaf", "innovatelab"];

  const handlePrevSlide = () => {
    setCurrentSlide(current => (current > 0 ? current - 1 : current));
  };

  const handleNextSlide = () => {
    setCurrentSlide(current => (current < reviews.length - 1 ? current + 1 : current));
  };

  return (
    <ReviewsContainer>
      <SectionTitle style={{ "--i": 3 }}>
        {t("reviewsTitle")}
      </SectionTitle>
      <ReviewsCarousel>
        <ReviewsTrack style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {reviews.map((reviewKey) => (
            <ReviewCard
              key={reviewKey}
              review={t(`reviews.${reviewKey}.text`)}
              company={t(`reviews.${reviewKey}.company`)}
              role={t(`reviews.${reviewKey}.role`)}
            />
          ))}
        </ReviewsTrack>
        <CarouselButton
          className="prev"
          onClick={handlePrevSlide}
          disabled={currentSlide === 0}
          aria-label="Previous review"
        >
          &#10094;
        </CarouselButton>
        <CarouselButton
          className="next"
          onClick={handleNextSlide}
          disabled={currentSlide === reviews.length - 1}
          aria-label="Next review"
        >
          &#10095;
        </CarouselButton>
      </ReviewsCarousel>
    </ReviewsContainer>
  );
}; 