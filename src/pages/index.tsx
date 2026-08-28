import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)} style={{padding: '4rem 0', textAlign: 'center'}}>
      <div className="container">
        <Heading as="h1" className="hero__title" style={{fontSize: '3rem', fontWeight: 800}}>
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle" style={{fontSize: '1.25rem', maxWidth: '750px', margin: '1rem auto 2rem', opacity: 0.9}}>
          {siteConfig.tagline}
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Language Overview
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/ebnf-grammar">
            EBNF Grammar
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/ir">
            Intermediate Representation (IR)
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/recipes">
            Cookbook
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Language Specification & Grammar"
      description="Official specification, EBNF grammar, Intermediate Representation (IR), and cookbook for RecQL (Recommender Query Language).">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
