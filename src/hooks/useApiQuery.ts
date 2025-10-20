import {
  type QueryKey,
  type UseQueryOptions,
  useQuery
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ApiErrorResponse {
  message?: string;
}

export interface UseApiQueryProps<T> {
  key: QueryKey;
  url: string;
  enabled?: boolean;
  options?: Partial<
    UseQueryOptions<T, AxiosError<ApiErrorResponse>, T, QueryKey>
  >;
  axiosConfig?: Parameters<typeof axios.get>[1];
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}

export function useApiQuery<T>({
  key,
  url,
  options,
  enabled,
  axiosConfig,
  onError
}: UseApiQueryProps<T>) {
  const result = useQuery<T, AxiosError<ApiErrorResponse>>({
    ...options,
    queryKey: key,
    queryFn: async () => {
      const res = await axios.get<T>(url, {
        ...axiosConfig
      });
      return res.data;
    },
    enabled
  });

  useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error.response?.data?.message ||
          "An unexpected error occurred. Please try again."
      );
      onError?.(result.error);
    }
  }, [result.isError, result.error, onError]);

  return {
    ...result
  };
}
