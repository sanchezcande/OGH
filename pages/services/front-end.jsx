import React from 'react';
import { useTranslation } from 'react-i18next';
import Head from 'next/head';

const FrontEnd = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{t('frontend.title')} - OpenGateHub</title>
        <meta name="description" content={t('frontend.description')} />
        <meta name="keywords" content="Frontend, Responsive Design, React, Modern Frameworks, Web Development" />
        <meta name="author" content="OpenGateHub" />
      </Head>

      {/* Page Content */}
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>{t('frontend.title')}</h1>
        <p>{t('frontend.description')}</p>

        <h2>{t('frontend.stepsTitle')}</h2>
        <ol>
          <li>{t('frontend.steps.step1')}</li>
          <li>{t('frontend.steps.step2')}</li>
          <li>{t('frontend.steps.step3')}</li>
        </ol>

        <h2>Solutions</h2>
        <ul>
          <li>{t('frontend.solutions.responsive')}</li>
          <li>{t('frontend.solutions.interactive')}</li>
          <li>{t('frontend.solutions.customized')}</li>
        </ul>

        <p><strong>{t('frontend.callToAction')}</strong></p>
      </div>
    </>
  );
};

export default FrontEnd;
