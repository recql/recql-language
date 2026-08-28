import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  badge: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Declarative Multi-Stage Pipelines',
    badge: 'Expressive',
    description: (
      <>
        Express candidate generation, vector retrieval, lexical search, machine learning scoring,
        and MMR diversity reordering in a single unified declarative query.
      </>
    ),
  },
  {
    title: 'Formal EBNF & Intermediate Representation',
    badge: 'Spec-Driven',
    description: (
      <>
        Queries lower deterministically into canonical IR, with support for direct IR submission
        via structured YAML/JSON or high-level RecQL SQL compilation.
      </>
    ),
  },
  {
    title: 'Vendor-Agnostic Engine',
    badge: 'Universal',
    description: (
      <>
        Run unchanged queries seamlessly against PostgreSQL + pgvector, Microsoft SQL Server 2025,
        Oracle 23ai, MongoDB, and MariaDB backends.
      </>
    ),
  },
];

function Feature({title, badge, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card" style={{height: '100%', padding: '1.5rem', background: 'var(--ifm-card-background-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '12px'}}>
        <div style={{marginBottom: '0.75rem'}}>
          <span className="badge badge--secondary" style={{fontSize: '0.75rem', textTransform: 'uppercase'}}>{badge}</span>
        </div>
        <Heading as="h3" style={{fontSize: '1.25rem', marginBottom: '0.75rem'}}>{title}</Heading>
        <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '0.95rem', lineHeight: '1.5'}}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features} style={{padding: '3rem 0'}}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
