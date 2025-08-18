import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MetricsSection as StyledMetricsSection,
  MetricsContainer,
  MetricsHeader,
  MetricsGrid,
  MetricCard,
  MetricValue,
  MetricUnit,
  MetricLabel,
  MetricDescription,
  MetricIcon,
  HowWeMeasureLink,
  Tooltip,
} from "../../styles/pagesStyles/Metrics.styles";
import { 
  FaRocket, 
  FaClock, 
  FaStar, 
  FaCodeBranch, 
  FaChartLine,
  FaPlay,
  FaCheckDouble,
  FaChartBar,
  FaTachometerAlt
} from "react-icons/fa";
import { 
  BiTrendingUp, 
  BiTimeFive, 
  BiCheckCircle, 
  BiGitBranch, 
  BiBarChart,
  BiTimer,
  BiTargetLock,
  BiPieChartAlt2,
  BiSpeedometer
} from "react-icons/bi";

const MetricsSection = () => {
  const { t } = useTranslation();
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const metrics = [
    {
      key: "avgKickoff",
      icon: <FaPlay />,
      delay: "0s",
    },
    {
      key: "onTimeDelivery",
      icon: <FaCheckDouble />,
      delay: "0.1s",
    },
    {
      key: "npsScore",
      icon: <FaStar />,
      delay: "0.2s",
    },
    {
      key: "sprintsShipped",
      icon: <FaCodeBranch />,
      delay: "0.3s",
    },
    {
      key: "cycleTimeReduction",
      icon: <FaTachometerAlt />,
      delay: "0.4s",
    },
  ];

  return (
    <StyledMetricsSection>
      <MetricsContainer>
        <MetricsHeader>
          <h2>{t("metricsSection.title")}</h2>
          <p>{t("metricsSection.subtitle")}</p>
        </MetricsHeader>

        <MetricsGrid>
          {metrics.map((metric) => {
            const metricData = t(`metricsSection.metrics.${metric.key}`, { returnObjects: true });
            const measurementDetail = t(`metricsSection.measurementDetails.${metric.key}`);
            
            return (
              <MetricCard key={metric.key} delay={metric.delay}>
                <MetricIcon>
                  {metric.icon}
                </MetricIcon>
                <MetricValue>
                  {metricData.value}
                  <MetricUnit>{metricData.unit}</MetricUnit>
                </MetricValue>
                <MetricLabel>{metricData.label}</MetricLabel>
                <MetricDescription>{metricData.description}</MetricDescription>
                <HowWeMeasureLink
                  onMouseEnter={() => setHoveredMetric(metric.key)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  {t("metricsSection.howWeMeasure")}
                  {hoveredMetric === metric.key && (
                    <Tooltip>
                      {measurementDetail}
                    </Tooltip>
                  )}
                </HowWeMeasureLink>
              </MetricCard>
            );
          })}
        </MetricsGrid>
      </MetricsContainer>
    </StyledMetricsSection>
  );
};

export default MetricsSection;
