import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { Document } from '@prismicio/client/types/documents';

import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import { formatDate } from '../utils/formatDate';

import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page?: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function mapResults(results: Document[]): Post[] {
  const posts = results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return posts;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  async function getNextPage(): Promise<void> {
    setIsLoadingMorePosts(true);
    try {
      const responseRaw = await fetch(nextPage);
      const responseJson: ApiSearchResponse = await responseRaw.json();
      const results = mapResults(responseJson.results);
      setPosts(prevState => [...prevState, ...results]);
      setNextPage(responseJson.next_page);
    } catch {
      return;
    } finally {
      setIsLoadingMorePosts(false);
    }
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main>
          {posts.map(post => {
            return (
              <div key={post.uid} className={styles.post}>
                <Link href={`/post/${post.uid}`}>
                  <h2>{post.data.title}</h2>
                </Link>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <time>
                    <FiCalendar /> {formatDate(post.first_publication_date)}
                  </time>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </div>
            );
          })}

          {nextPage && (
            <button
              className={styles.button}
              type="button"
              onClick={() => getNextPage()}
            >
              {isLoadingMorePosts ? 'Carregando...' : 'Carregar mais posts'}
            </button>
          )}
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 10,
    }
  );

  const nextPage = response.next_page;

  const results = mapResults(response.results);

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results,
      },
    },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
