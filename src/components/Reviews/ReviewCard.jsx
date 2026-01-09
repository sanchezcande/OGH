import {
  ReviewCard as StyledReviewCard,
  ReviewText,
  ReviewAuthor,
  CompanyName,
  AuthorRole,
} from "../../styles/components/Reviews.styles";

export const ReviewCard = ({ review, company, role }) => {
  return (
    <StyledReviewCard>
      <ReviewText>{review}</ReviewText>
      <ReviewAuthor>
        <CompanyName>{company}</CompanyName>
        <AuthorRole>{role}</AuthorRole>
      </ReviewAuthor>
    </StyledReviewCard>
  );
};
