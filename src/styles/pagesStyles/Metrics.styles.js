import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

export const MetricsSection = styled.section`
  width: 100%;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F97B72' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }

  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

export const MetricsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

export const MetricsHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
  opacity: 0;
  animation: ${fadeInUp} 0.8s ease-out forwards;

  h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #F97B72 0%, #E35A52 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    font-size: 1.2rem;
    color: #64748b;
    margin: 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }
`;

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

export const MetricCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(30px);
  animation: ${fadeInUp} 0.8s ease-out forwards;
  animation-delay: ${props => props.delay || '0s'};

  &:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 20px 25px rgba(0, 0, 0, 0.1),
      0 10px 10px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

export const MetricValue = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: #F97B72;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

export const MetricUnit = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  color: #64748b;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

export const MetricLabel = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const MetricDescription = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

export const MetricIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #F97B72 0%, #E35A52 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`;

export const HowWeMeasureLink = styled.div`
  position: relative;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    border-color: #94a3b8;
    color: #334155;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
`;

export const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 1rem;
  background: #1e293b;
  color: white;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
  max-width: 280px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  white-space: normal;
  text-align: left;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #1e293b;
  }

  @media (max-width: 768px) {
    max-width: 240px;
    font-size: 0.75rem;
    padding: 0.8rem;
  }
`;
