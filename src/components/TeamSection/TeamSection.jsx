import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  TeamSection as StyledTeamSection,
  TeamMemberCard,
} from "../../styles/pagesStyles/AboutUs.styles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TeamSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const teamMembers = [
    {
      id: 1,
      name: t("teamSection.members.gustavo.name"),
      role: t("teamSection.members.gustavo.role"),
      image: "/team/gus.jpg",
      description: t("teamSection.members.gustavo.description"),
    },
    {
      id: 7,
      name: t("teamSection.members.ilia.name"),
      role: t("teamSection.members.ilia.role"),
      image: "/team/Ilia.jpeg",
      description: t("teamSection.members.ilia.description"),
    },
    {
      id: 6,
      name: t("teamSection.members.vadym.name"),
      role: t("teamSection.members.vadym.role"),
      image: "/team/Vadym.JPG",
      description: t("teamSection.members.vadym.description"),
    },
    {
      id: 2,
      name: t("teamSection.members.javier.name"),
      role: t("teamSection.members.javier.role"),
      image: "/team/javi.jpg",
      description: t("teamSection.members.javier.description"),
      imagePosition: "center 32%",
    },
    {
      id: 3,
      name: t("teamSection.members.giuliano.name"),
      role: t("teamSection.members.giuliano.role"),
      image: "/team/giuli.jpg",
      description: t("teamSection.members.giuliano.description"),
    },
    {
      id: 4,
      name: t("teamSection.members.laura.name"),
      role: t("teamSection.members.laura.role"),
      image: "/team/lau.jpg",
      description: t("teamSection.members.laura.description"),
    },
    {
      id: 5,
      name: t("teamSection.members.alejandria.name"),
      role: t("teamSection.members.alejandria.role"),
      image: "/team/ale.jpg",
      description: t("teamSection.members.alejandria.description"),
      imagePosition: "center 25%",
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;
    let ctx;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const section = sectionRef.current;
        const title = section.querySelector(".team-title");
        const subtitle = section.querySelector(".team-subtitle");
        const cards = section.querySelectorAll(".team-card");

        // Title — clip reveal from left
        gsap.fromTo(
          title,
          { opacity: 0, clipPath: "inset(0 100% 0 0)" },
          {
            opacity: 1,
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 75%" },
          }
        );

        gsap.fromTo(
          subtitle,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: subtitle, start: "top 75%" },
          }
        );

        // Cards — staggered reveal with B&W
        cards.forEach((card, i) => {
          const img = card.querySelector(".member-image img");

          if (img) {
            gsap.set(img, { scale: 1.15 });
          }

          // Card entrance — clip from bottom + fade
          gsap.fromTo(
            card,
            {
              opacity: 0,
              y: 100,
              clipPath: "inset(30% 0 0 0)",
            },
            {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0 0 0)",
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );

          if (img) {
            // Parallax
            gsap.fromTo(
              img,
              { yPercent: -10 },
              {
                yPercent: 10,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              }
            );

            // Zoom out on scroll
            gsap.to(img, {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 70%",
                end: "top 25%",
                scrub: 0.6,
              },
            });
          }
        });

        ScrollTrigger.refresh();
      }, sectionRef);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <StyledTeamSection ref={sectionRef}>
      <h2 className="team-title">{t("teamSection.title")}</h2>
      <p className="team-subtitle">{t("teamSection.subtitle")}</p>

      <div className="team-grid">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} className="team-card">
            <div className="member-image">
              <Image
                src={member.image}
                alt={`${member.name} - ${member.role}`}
                width={400}
                height={530}
                quality={90}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: member.imagePosition || "center 15%",
                }}
              />
            </div>

            <div className="member-info">
              <h3 className="member-name">{member.name}</h3>
              <p className="member-role">{member.role}</p>
            </div>

            <div className="member-overlay">
              <p className="member-description">{member.description}</p>
              <h3 className="overlay-name">{member.name}</h3>
              <p className="overlay-role">{member.role}</p>
            </div>
          </TeamMemberCard>
        ))}
      </div>
    </StyledTeamSection>
  );
};

export default TeamSection;
