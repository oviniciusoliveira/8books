import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';
import { accessToken, apiEndpoint } from '../config/prismic';

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(apiEndpoint, {
    req,
    accessToken,
  });

  return prismic;
}
