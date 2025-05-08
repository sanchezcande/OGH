import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import {
  ReviewsContainer,
  ReviewsCarousel,
  ReviewsTrack,
  CarouselButton,
  ReviewsWrapper
} from "../../styles/components/Reviews.styles";
import { SectionTitle } from "../../styles/pagesStyles/HomePages.styles";

export const ReviewsSection = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const reviews = ["skylar", "techvision", "greenleaf", "innovatelab"];

  const handlePrevSlide = () => {
    setCurrentSlide(current => (current === 0 ? reviews.length - 1 : current - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(current => (current === reviews.length - 1 ? 0 : current + 1));
  };

  return (
    <ReviewsContainer>
      <SectionTitle style={{ "--i": 3 }}>
        {t("reviewsTitle")}
      </SectionTitle>
      <ReviewsCarousel>
        <ReviewsWrapper>
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
        </ReviewsWrapper>
        <CarouselButton
          className="prev"
          onClick={handlePrevSlide}
          aria-label="Previous review"
        >
          &#10094;
        </CarouselButton>
        <CarouselButton
          className="next"
          onClick={handleNextSlide}
          aria-label="Next review"
        >
          &#10095;
        </CarouselButton>
      </ReviewsCarousel>
    </ReviewsContainer>
  );
}; 