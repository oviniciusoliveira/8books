import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';

import { v4 as uuidv4 } from 'uuid';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import * as prismicH from '@prismicio/helpers';
import { useRouter } from 'next/router';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Header from '../../components/Header';
import { formatDate } from '../../utils/formatDate';
import { UtterancComments } from '../../components/UtterancComments';

interface ContentData {
  heading: string;
  body: Record<string, unknown>[];
}
interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: ContentData[];
  };
}

interface PostProps {
  post?: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  function calculateEstimatedReadingTime(content): number {
    const totalContentWords = content.reduce((acc, contentData) => {
      const words = prismicH.asText(contentData.body).split(' ').length;
      return acc + words;
    }, 0);

    const estimated_reading_time = Math.ceil(totalContentWords / 200);
    return estimated_reading_time;
  }

  return (
    <>
      <Header />
      {router.isFallback ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className={styles.banner}>
            <Image src={post.data.banner.url} layout="fill" />
          </div>
          <main className={styles.container}>
            <h1>{post.data.title}</h1>
            <div className={styles.postInfo}>
              <span>
                <FiCalendar /> {formatDate(post.first_publication_date)}
              </span>
              <span>
                <FiUser /> {post.data.author}
              </span>
              <time>
                <FiClock /> {calculateEstimatedReadingTime(post.data.content)}{' '}
                min
              </time>
            </div>
            <section className={styles.content}>
              {post.data.content.map(content => {
                return (
                  <div key={uuidv4()} className={styles.contentBlock}>
                    <h2>{content.heading}</h2>
                    {content.body.map(body => {
                      return <p key={uuidv4()}>{body.text}</p>;
                    })}
                  </div>
                );
              })}
            </section>

            <UtterancComments />
          </main>
        </>
      )}
    </>
  );
}

function mapContent(content: any): ContentData[] {
  const mappedContent = content.map(contentData => {
    return {
      heading: contentData.heading,
      body: contentData.body.map(body => {
        return {
          text: body.text,
          spans: body.spans,
          type: body.type,
        };
      }),
    };
  });

  return mappedContent;
}

function mapPost(document: Document): Post {
  const post = {
    first_publication_date: document.first_publication_date,
    uid: document.uid,
    data: {
      title: document.data.title,
      subtitle: document.data.subtitle,
      banner: {
        url: document.data.banner.url,
      },
      author: document.data.author,
      content: mapContent(document.data.content),
    },
  };

  return post;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
    }
  );

  const paths = response.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = mapPost(response);

  return {
    props: {
      post,
    },

    revalidate: 60 * 60 * 24, // 1 day
  };
};
