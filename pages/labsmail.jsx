import React from "react";
import Head from "next/head";
import styled, { createGlobalStyle } from "styled-components";

const ResetStyles = createGlobalStyle`
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #fafafa;
    color: #111;
    line-height: 1.65;
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
  }
`;

/* ── Colors ── */
const G = "#059669";
const GBG = "#ecfdf5";
const BLUE = "#2563eb";
const BLUEBG = "#eff6ff";
const RED = "#dc2626";
const ORANGE = "#d97706";

/* ── Nav ── */
const Nav = styled.nav`
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(250,250,250,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e5e5;
`;
const NavInner = styled.div`
  max-width: 1200px; margin: 0 auto; padding: 0 40px; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  @media (max-width: 640px) { padding: 0 20px; }
`;
const NavBrand = styled.a`
  font-size: 15px; font-weight: 800; letter-spacing: -0.03em; color: #111; text-decoration: none;
`;
const NavLinks = styled.div`
  display: flex; align-items: center; gap: 28px;
  a { font-size: 0.82rem; font-weight: 600; color: #999; text-decoration: none; transition: color 0.15s; }
  a:hover { color: #111; }
  @media (max-width: 640px) { a:not(:last-child) { display: none; } }
`;
const NavCTA = styled.a`
  font-size: 0.78rem !important; font-weight: 700 !important;
  color: #fff !important; background: ${G}; padding: 8px 20px; border-radius: 8px;
  transition: all 0.15s; &:hover { background: #047857; }
`;

/* ── Hero ── */
const HeroWrap = styled.section`
  padding: 140px 40px 80px; max-width: 1200px; margin: 0 auto;
  @media (max-width: 640px) { padding: 110px 20px 48px; }
`;
const HeroLabel = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  color: ${G}; background: ${GBG}; padding: 6px 14px; border-radius: 20px; margin-bottom: 24px;
`;
const HeroTitle = styled.h1`
  font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.08;
  color: #111; letter-spacing: -0.035em; margin-bottom: 20px; max-width: 680px;
`;
const HeroSub = styled.p`
  font-size: 16px; color: #555; line-height: 1.65; max-width: 520px; margin-bottom: 40px;
`;
const HeroCTA = styled.a`
  display: inline-flex; align-items: center; gap: 10px;
  background: ${G}; color: #fff; padding: 14px 32px; border-radius: 8px;
  font-size: 14px; font-weight: 700; text-decoration: none;
  transition: all 0.15s; cursor: pointer; box-shadow: 0 4px 14px rgba(5,150,105,0.3);
  &:hover { background: #047857; box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
  svg { width: 16px; height: 16px; }
`;
const HeroProof = styled.div`
  margin-top: 32px; display: flex; align-items: center; gap: 24px;
  font-size: 0.78rem; color: #999;
  @media (max-width: 640px) { flex-direction: column; align-items: flex-start; gap: 12px; }
`;
const ProofItem = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
`;
const GreenDot = styled.span`
  width: 8px; height: 8px; border-radius: 50%; background: ${G};
  box-shadow: 0 0 0 3px ${GBG};
`;

/* ── Dashboard Preview ── */
const PreviewSection = styled.section`
  max-width: 1200px; margin: 0 auto; padding: 0 40px 96px;
  @media (max-width: 640px) { padding: 0 20px 64px; }
`;
const DashboardFrame = styled.div`
  background: #fff; border: 1px solid #e5e5e5; border-radius: 12px;
  overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.06);
`;
const DashTabs = styled.div`
  display: flex; gap: 0; border-bottom: 2px solid #e5e5e5; padding: 0 24px;
`;
const DashTab = styled.div`
  padding: 12px 20px; font-size: 0.82rem; font-weight: 600;
  color: ${p => p.$active ? '#111' : '#999'};
  border-bottom: 2px solid ${p => p.$active ? '#111' : 'transparent'};
  margin-bottom: -2px;
`;
const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border-bottom: 1px solid #e5e5e5;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
`;
const StatCard = styled.div`
  padding: 24px 28px; border-right: 1px solid #e5e5e5;
  &:last-child { border-right: none; }
  @media (max-width: 700px) {
    border-bottom: 1px solid #e5e5e5;
    &:nth-child(2) { border-right: none; }
  }
`;
const StatLabel = styled.div`
  font-size: 0.68rem; font-weight: 600; color: #999; text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 8px;
`;
const StatVal = styled.div`
  font-size: 2.2rem; font-weight: 800; line-height: 1;
  font-variant-numeric: tabular-nums; color: ${p => p.color || '#111'};
`;
const StatSub = styled.div`
  font-size: 0.75rem; color: #999; margin-top: 6px;
`;
const DashBody = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;
const DashPanel = styled.div`
  padding: 24px 28px;
  ${p => p.$border ? 'border-right: 1px solid #e5e5e5;' : ''}
  @media (max-width: 700px) {
    border-right: none;
    ${p => p.$border ? 'border-bottom: 1px solid #e5e5e5;' : ''}
  }
`;
const FunnelRow = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
`;
const FunnelLabel = styled.div`
  font-size: 0.75rem; font-weight: 600; color: #555; width: 70px; text-align: right; flex-shrink: 0;
`;
const FunnelTrack = styled.div`
  flex: 1; height: 28px; background: #f5f5f5; border-radius: 6px; overflow: hidden;
`;
const FunnelBar = styled.div`
  height: 100%; border-radius: 6px; width: ${p => p.w}%;
  background: ${p => p.color};
`;
const FunnelNum = styled.div`
  font-size: 0.78rem; font-weight: 700; color: #555; width: 50px; flex-shrink: 0;
`;
const ReplyItem = styled.div`
  padding: 14px 0; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
`;
const ReplyName = styled.div`font-size: 0.88rem; font-weight: 700; color: #111;`;
const ReplyMeta = styled.div`font-size: 0.75rem; color: #999; margin-top: 2px;`;

/* ── Email Example ── */
const EmailSection = styled.section`
  max-width: 1200px; margin: 0 auto; padding: 0 40px 96px;
  @media (max-width: 640px) { padding: 0 20px 64px; }
`;
const EmailSplit = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 32px; }
`;
const EmailText = styled.div``;
const SLabel = styled.div`
  font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  color: #999; margin-bottom: 16px;
`;
const STitle = styled.h2`
  font-size: clamp(22px, 3vw, 30px); font-weight: 800; color: #111;
  letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 16px;
`;
const SDesc = styled.p`
  font-size: 14.5px; color: #555; line-height: 1.7; margin-bottom: 0;
`;
const EmailCard = styled.div`
  background: #fff; border: 1px solid #e5e5e5; border-radius: 12px;
  overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.06);
`;
const EmailHeader = styled.div`
  padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0; background: #fafafa;
`;
const EmailFrom = styled.span`font-weight: 700; font-size: 0.85rem; color: #111;`;
const Badge = styled.span`
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;
  background: ${p => p.bg}; color: ${p => p.c};
`;
const EmailSubject = styled.div`
  padding: 14px 24px 0; font-size: 0.85rem; font-weight: 700; color: #111;
`;
const EmailBody = styled.div`
  padding: 12px 24px 20px; font-size: 0.85rem; line-height: 1.7; color: #555;
  white-space: pre-wrap;
`;
const EmailReply = styled.div`
  border-top: 1px solid #e5e5e5; padding: 16px 24px; background: ${GBG};
`;
const ReplyBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 700; color: ${G}; margin-bottom: 8px;
`;
const ReplyText = styled.div`
  font-size: 0.85rem; line-height: 1.7; color: #333; font-style: italic;
`;

/* ── Section generics ── */
const Section = styled.section`
  max-width: 1200px; margin: 0 auto; padding: 96px 40px;
  @media (max-width: 640px) { padding: 64px 20px; }
`;

/* ── Features ── */
const FeatGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const FeatCard = styled.div`
  background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 28px;
  transition: all 0.15s;
  &:hover { border-color: #ccc; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
`;
const FeatIcon = styled.div`
  width: 36px; height: 36px; border-radius: 8px; background: ${GBG}; color: ${G};
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  font-size: 16px;
`;
const FeatTitle = styled.h3`
  font-size: 0.92rem; font-weight: 700; color: #111; margin-bottom: 6px;
`;
const FeatDesc = styled.p`
  font-size: 0.82rem; color: #777; line-height: 1.6; margin: 0;
`;

/* ── Process ── */
const ProcGrid = styled.div`
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 0;
  background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const ProcStep = styled.div`
  padding: 32px 24px; border-right: 1px solid #e5e5e5;
  &:last-child { border-right: none; }
  @media (max-width: 900px) { border-right: none; border-bottom: 1px solid #e5e5e5; &:last-child { border-bottom: none; } }
`;
const ProcNum = styled.span`
  font-size: 0.68rem; font-weight: 700; color: ${G}; background: ${GBG};
  padding: 3px 8px; border-radius: 4px; margin-bottom: 16px; display: inline-block;
`;
const ProcTitle = styled.h3`
  font-size: 0.88rem; font-weight: 700; color: #111; margin-bottom: 8px;
`;
const ProcDesc = styled.p`
  font-size: 0.82rem; color: #777; line-height: 1.6; margin: 0;
`;

/* ── Dark section ── */
const DarkWrap = styled.div`
  background: #111; padding: 96px 0;
  @media (max-width: 640px) { padding: 64px 0; }
`;
const DarkInner = styled.div`
  max-width: 1200px; margin: 0 auto; padding: 0 40px;
  @media (max-width: 640px) { padding: 0 20px; }
`;
const ResGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
  background: #2a2a2a; border-radius: 12px; overflow: hidden;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;
const ResCard = styled.div`
  background: #1a1a1a; padding: 36px;
`;
const ResNum = styled.span`
  font-size: 0.68rem; font-weight: 700; color: ${G}; margin-bottom: 14px; display: block;
`;
const ResTitle = styled.h3`
  font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 8px;
`;
const ResDesc = styled.p`
  font-size: 0.82rem; color: #777; line-height: 1.6; margin: 0;
`;

/* ── CTA ── */
const CTAWrap = styled.section`
  max-width: 1200px; margin: 0 auto; padding: 96px 40px; text-align: center;
  @media (max-width: 640px) { padding: 64px 20px; }
`;
const CTATitle = styled.h2`
  font-size: clamp(26px, 4vw, 38px); font-weight: 800; color: #111;
  letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 16px;
`;
const CTADesc = styled.p`
  font-size: 15px; color: #555; max-width: 440px; margin: 0 auto 40px;
`;

/* ── Footer ── */
const Foot = styled.footer`
  border-top: 1px solid #e5e5e5; max-width: 1200px; margin: 0 auto;
  padding: 28px 40px; display: flex; justify-content: space-between; align-items: center;
  @media (max-width: 640px) { padding: 20px; }
`;
const FootBrand = styled.div`font-weight: 800; font-size: 13px; color: #111; letter-spacing: -0.02em;`;
const FootRight = styled.div`
  display: flex; align-items: center; gap: 24px; font-size: 12px; color: #999;
  a { color: #999; text-decoration: none; &:hover { color: #111; } }
`;

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8h9M8.5 4l4 4-4 4" />
  </svg>
);

/* ===================================================================
   PAGE
   =================================================================== */

const LabsMail = () => (
  <>
    <Head>
      <title>LabsMail — AI-Powered Personalized Cold Email Outreach</title>
      <meta name="description" content="We find your ideal prospects, research them individually, and write hyper-personalized emails that get replies. 11.4% reply rate. Zero templates. Full pipeline management." />
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%23059669'/><text x='50' y='64' text-anchor='middle' font-family='system-ui' font-weight='800' font-size='38' fill='%23fff'>LM</text></svg>" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
    <ResetStyles />

    {/* NAV */}
    <Nav>
      <NavInner>
        <NavBrand href="/labsmail">LabsMail</NavBrand>
        <NavLinks>
          <a href="#how-it-works">How it works</a>
          <a href="#dashboard">Live dashboard</a>
          <a href="#results">Results</a>
          <NavCTA href="#book">Book a call</NavCTA>
        </NavLinks>
      </NavInner>
    </Nav>

    {/* HERO */}
    <HeroWrap>
      <HeroLabel>
        <GreenDot />
        AI-powered outreach engine
      </HeroLabel>
      <HeroTitle>
        Your next 50 clients are one email away
      </HeroTitle>
      <HeroSub>
        We research every prospect individually and write cold emails so personal they don&apos;t feel cold.
        No templates. No spray-and-pray. Just conversations with people who want to talk.
      </HeroSub>
      <HeroCTA href="#book">
        Book a free strategy call
        <Arrow />
      </HeroCTA>
      <HeroProof>
        <ProofItem><GreenDot /> 11.4% avg reply rate</ProofItem>
        <ProofItem><GreenDot /> 4,200+ emails sent</ProofItem>
        <ProofItem><GreenDot /> 0% bounce rate</ProofItem>
      </HeroProof>
    </HeroWrap>

    {/* DASHBOARD PREVIEW */}
    <PreviewSection id="dashboard">
      <SLabel>Live client dashboard</SLabel>
      <DashboardFrame>
        <DashTabs>
          <DashTab $active>Overview</DashTab>
          <DashTab>Replies</DashTab>
          <DashTab>Analytics</DashTab>
        </DashTabs>
        <StatsGrid>
          <StatCard>
            <StatLabel>Total contacts</StatLabel>
            <StatVal>4,218</StatVal>
            <StatSub>2,847 with verified email</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Emails sent</StatLabel>
            <StatVal color={BLUE}>2,156</StatVal>
            <StatSub>38 today</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Replied</StatLabel>
            <StatVal color={G}>246</StatVal>
            <StatSub>11.4%</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Bounced</StatLabel>
            <StatVal color={RED}>0</StatVal>
            <StatSub>0.0%</StatSub>
          </StatCard>
        </StatsGrid>
        <DashBody>
          <DashPanel $border>
            <StatLabel style={{ marginBottom: 20 }}>Pipeline funnel</StatLabel>
            <FunnelRow>
              <FunnelLabel>Sent</FunnelLabel>
              <FunnelTrack><FunnelBar w={100} color={BLUE} /></FunnelTrack>
              <FunnelNum>2,156</FunnelNum>
            </FunnelRow>
            <FunnelRow>
              <FunnelLabel>Replied</FunnelLabel>
              <FunnelTrack><FunnelBar w={11.4} color={G} /></FunnelTrack>
              <FunnelNum>246</FunnelNum>
            </FunnelRow>
            <FunnelRow>
              <FunnelLabel>Bounced</FunnelLabel>
              <FunnelTrack><FunnelBar w={0} color={RED} /></FunnelTrack>
              <FunnelNum>0</FunnelNum>
            </FunnelRow>
            <FunnelRow>
              <FunnelLabel>New</FunnelLabel>
              <FunnelTrack><FunnelBar w={48} color="#999" /></FunnelTrack>
              <FunnelNum>1,371</FunnelNum>
            </FunnelRow>
          </DashPanel>
          <DashPanel>
            <StatLabel style={{ marginBottom: 20 }}>Recent replies</StatLabel>
            <ReplyItem><ReplyName>Marcus Chen</ReplyName><ReplyMeta>Apex Digital Group &middot; New York</ReplyMeta></ReplyItem>
            <ReplyItem><ReplyName>Sarah Whitfield</ReplyName><ReplyMeta>Catalyst Agency &middot; London</ReplyMeta></ReplyItem>
            <ReplyItem><ReplyName>James Okafor</ReplyName><ReplyMeta>BrightPath Media &middot; Sydney</ReplyMeta></ReplyItem>
            <ReplyItem><ReplyName>Elena Voss</ReplyName><ReplyMeta>Voss & Partners &middot; Toronto</ReplyMeta></ReplyItem>
            <ReplyItem><ReplyName>David Morales</ReplyName><ReplyMeta>Morales Growth Lab &middot; Miami</ReplyMeta></ReplyItem>
          </DashPanel>
        </DashBody>
      </DashboardFrame>
    </PreviewSection>

    {/* EMAIL EXAMPLE */}
    <EmailSection>
      <EmailSplit>
        <EmailText>
          <SLabel>The product is the email itself</SLabel>
          <STitle>Every email is written from real research. Zero templates.</STitle>
          <SDesc>
            Our AI researches each prospect individually &mdash; their LinkedIn, company story, recent
            news, career moves &mdash; and writes an email that proves we did our homework.
            <br /><br />
            The result? Replies like the one on the right. From founders who actually want to talk.
          </SDesc>
        </EmailText>
        <div>
          <EmailCard>
            <EmailHeader>
              <EmailFrom>To: Marcus Chen</EmailFrom>
              <Badge bg={BLUEBG} c={BLUE}>Sent</Badge>
            </EmailHeader>
            <EmailSubject>Apex&apos;s Shopify Plus work for Allbirds</EmailSubject>
            <EmailBody>{`Marcus,

Saw that Apex rebuilt the entire Allbirds checkout on Shopify Plus last quarter. The 40% faster load times got picked up by Shopify's own case study page.

That kind of work is exactly what agencies struggle to communicate in outbound. This email took me 3 minutes to research and write, powered by AI.

Imagine 200 like this going out to your ideal clients every month. Want to see what it'd look like for Apex?

Cande`}</EmailBody>
            <EmailReply>
              <ReplyBadge>
                <GreenDot /> Marcus replied
              </ReplyBadge>
              <ReplyText>
                &ldquo;Ok this is impressive. The Allbirds reference caught my eye because we literally just wrapped that project. How does this work exactly? I&apos;d love to chat.&rdquo;
              </ReplyText>
            </EmailReply>
          </EmailCard>
        </div>
      </EmailSplit>
    </EmailSection>

    {/* FEATURES */}
    <Section>
      <SLabel>What&apos;s included</SLabel>
      <STitle style={{ marginBottom: 48 }}>Full-stack outreach, done for you</STitle>
      <FeatGrid>
        {[
          { icon: "&#x1F50D;", title: "Lead discovery", desc: "Decision-makers with verified personal emails. Filtered by industry, role, location, company size. No generic info@ addresses." },
          { icon: "&#x1F9E0;", title: "Deep AI research", desc: "Each prospect researched individually: LinkedIn, company story, news, podcasts, career trajectory. We find the angle." },
          { icon: "&#x270D;&#xFE0F;", title: "Personalized writing", desc: "Every email written from scratch. Subject lines that reference something real. Opening lines that prove you did your homework." },
          { icon: "&#x1F6E1;&#xFE0F;", title: "Deliverability infra", desc: "Warmed domains, SPF/DKIM/DMARC, daily volume caps, multi-domain rotation. Inbox, not spam." },
          { icon: "&#x1F504;", title: "Smart follow-ups", desc: "6-7 strategically timed follow-ups that add value and vary the angle. Auto-stops when they reply." },
          { icon: "&#x1F4CA;", title: "Real-time CRM", desc: "Track every reply, manage conversations, analytics by geography and time. Reply classification + AI response suggestions." },
        ].map((f, i) => (
          <FeatCard key={i}>
            <FeatIcon dangerouslySetInnerHTML={{ __html: f.icon }} />
            <FeatTitle>{f.title}</FeatTitle>
            <FeatDesc>{f.desc}</FeatDesc>
          </FeatCard>
        ))}
      </FeatGrid>
    </Section>

    {/* PROCESS */}
    <Section id="how-it-works" style={{ paddingTop: 0 }}>
      <SLabel>How it works</SLabel>
      <STitle style={{ marginBottom: 48 }}>From zero to replies in your inbox</STitle>
      <ProcGrid>
        {[
          { title: "Discovery", desc: "We identify your ideal customers with verified emails, filtered by your exact ICP." },
          { title: "Research", desc: "AI deep-dives into each prospect. LinkedIn, news, podcasts. We find what makes them tick." },
          { title: "Write", desc: "Every email crafted from scratch. No templates. Real personalization that earns attention." },
          { title: "Send", desc: "Warmed domains, volume safeguards, optimal timing. Maximum inbox placement." },
          { title: "Track", desc: "Live dashboard with reply tracking, conversation management, and analytics in real time." },
        ].map((s, i) => (
          <ProcStep key={i}>
            <ProcNum>0{i + 1}</ProcNum>
            <ProcTitle>{s.title}</ProcTitle>
            <ProcDesc>{s.desc}</ProcDesc>
          </ProcStep>
        ))}
      </ProcGrid>
    </Section>

    {/* RESULTS */}
    <DarkWrap id="results">
      <DarkInner>
        <SLabel style={{ color: '#777' }}>What you get</SLabel>
        <STitle style={{ color: '#fff', marginBottom: 48 }}>Pipeline, not just leads</STitle>
        <ResGrid>
          {[
            { title: "Qualified conversations", desc: "Decision-makers replying because your email felt relevant and human. Not because you blasted 10,000 people." },
            { title: "Protected sender reputation", desc: "Multi-domain infrastructure, warm-up protocols, and volume safeguards. Pristine deliverability." },
            { title: "Full pipeline visibility", desc: "Every lead tracked from discovery through reply. Analytics that show exactly what's working and where." },
            { title: "Your time back", desc: "No more hours on lead lists, email writing, or follow-up tracking. We handle the entire outreach engine." },
          ].map((r, i) => (
            <ResCard key={i}>
              <ResNum>0{i + 1}</ResNum>
              <ResTitle>{r.title}</ResTitle>
              <ResDesc>{r.desc}</ResDesc>
            </ResCard>
          ))}
        </ResGrid>
      </DarkInner>
    </DarkWrap>

    {/* CTA */}
    <CTAWrap id="book">
      <CTATitle>Ready to fill your pipeline?</CTATitle>
      <CTADesc>Book a free strategy call. We&apos;ll show you exactly how LabsMail would work for your market.</CTADesc>
      <HeroCTA href="https://calendly.com" target="_blank" rel="noopener noreferrer">
        Book a free strategy call
        <Arrow />
      </HeroCTA>
    </CTAWrap>

    {/* FOOTER */}
    <Foot>
      <FootBrand>LabsMail</FootBrand>
      <FootRight>
        <a href="mailto:cande@labsmail.com">cande@labsmail.com</a>
        <span>&copy; 2026</span>
      </FootRight>
    </Foot>
  </>
);

export default LabsMail;
