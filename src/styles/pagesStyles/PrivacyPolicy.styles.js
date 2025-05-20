import styled from "styled-components";

export const PrivacyPolicyContainer = styled.section`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const PrivacyPolicyTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
`;

export const PrivacyPolicySection = styled.div`
  margin-bottom: 2rem;
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

export const SectionContent = styled.p`
  font-size: 1rem;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

export const List = styled.ul`
  margin-left: 20px;
  list-style-type: disc;

  li {
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.text};
  }
`;
