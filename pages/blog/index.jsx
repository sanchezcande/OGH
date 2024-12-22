import React from "react";
import styled from "styled-components";

const BlogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
  color: white;
  font-family: Arial, sans-serif;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.lightBlue};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const WorkingImage = styled.img`
  width: 150px;
  height: auto;
  margin-bottom: 1.5rem;
`;

const BlogPlaceholder = () => {
  return (
    <BlogContainer>
      <WorkingImage
        src="/path-to-your-working-icon.png"
        alt="Working on it"
      />
      <Title>Blog Page Under Construction</Title>
      <Subtitle>We are working hard to bring you the latest updates. Stay tuned!</Subtitle>
    </BlogContainer>
  );
};

export default BlogPlaceholder;
