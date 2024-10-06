import { useCallback, useState } from "react"
import { PaginatedResponse, RequestByEmployeeParams, Transaction } from "../utils/types"
import { TransactionsByEmployeeResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

// This function is changed to always use pagination as required
export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  // Bug 7: the item was caching so it wasn't being updated
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<PaginatedResponse<
  Transaction[]
> | null>(null)

  const fetchById = useCallback(
    async (employeeId: string) => {
      const response = await fetchWithoutCache<PaginatedResponse<Transaction[]>, RequestByEmployeeParams>(
        "transactionsByEmployee",
        {
          employeeId,
          page: (transactionsByEmployee === null || transactionsByEmployee.nextPage === null) ? 0 : transactionsByEmployee.nextPage,
        }
      )

      setTransactionsByEmployee((previousResponse) => {
        if (response === null || previousResponse === null) {
          return response
        }

        else return { data: [...previousResponse.data, ...response.data], nextPage: response.nextPage }
      })
    },
    [fetchWithoutCache, transactionsByEmployee]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null)
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData }
}
