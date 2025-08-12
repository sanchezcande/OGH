import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { TeamSection as StyledTeamSection, TeamMemberCard } from "../../styles/pagesStyles/AboutUs.styles";

const TeamSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    const currentSectionRef = sectionRef.current;
    if (currentSectionRef) observer.observe(currentSectionRef);

    cardRefs.current.forEach((cardRef) => {
      if (cardRef) observer.observe(cardRef);
    });

    return () => {
      if (currentSectionRef) observer.unobserve(currentSectionRef);
      cardRefs.current.forEach((cardRef) => {
        if (cardRef) observer.unobserve(cardRef);
      });
    };
  }, []);

  const teamMembers = [
    {
      id: 1,
      name: t("teamSection.members.javier.name"),
      role: t("teamSection.members.javier.role"),
      image: "/team/javi.jpg",
      description: t("teamSection.members.javier.description")
    },
    {
      id: 2,
      name: t("teamSection.members.giuliano.name"),
      role: t("teamSection.members.giuliano.role"),
      image: "/team/giuli.jpg",
      description: t("teamSection.members.giuliano.description")
    },
    {
      id: 3,
      name: t("teamSection.members.laura.name"),
      role: t("teamSection.members.laura.role"),
      image: "/team/lau.jpg",
      description: t("teamSection.members.laura.description")
    }
  ];

  return (
    <StyledTeamSection ref={sectionRef}>
      <h2 className="team-title">{t("teamSection.title")}</h2>
      <p className="team-subtitle">
        {t("teamSection.subtitle")}
      </p>
      
      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <TeamMemberCard
            key={member.id}
            ref={(el) => (cardRefs.current[index] = el)}
          >
            <div className="member-image">
              <Image
                src={member.image}
                alt={`${member.name} - ${member.role}`}
                width={120}
                height={120}
                quality={100}
              />
            </div>
            <h3 className="member-name">{member.name}</h3>
            <p className="member-role">{member.role}</p>
            <p className="member-description">{member.description}</p>
          </TeamMemberCard>
        ))}
      </div>
    </StyledTeamSection>
  );
};

export default TeamSection;
