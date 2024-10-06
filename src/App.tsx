import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [currentEmployee, setCurrentEmployee] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => {
      return {
        data: paginatedTransactions?.data ?? transactionsByEmployee?.data ?? null,
        nextPage: paginatedTransactions?.nextPage ?? transactionsByEmployee?.nextPage ?? null
      }
    },
    [paginatedTransactions, transactionsByEmployee]
  )

  // Bug 5: Separate out employee fetches from any new transaction fetches
  //        + use isLoading for only loading employees
  // keep this as a function in case new employees are added since the page first rendered
  const loadAllEmployees = useCallback(async () => {
    setIsLoading(true)
    
    paginatedTransactionsUtils.invalidateData()
    transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()

    setIsLoading(false)

    await paginatedTransactionsUtils.fetch()

  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()

      // Bug 3: AllEmployees does not have an employee ID, call the original func to load all
      if (employeeId === "") {
        loadAllEmployees()
        setCurrentEmployee("")
      }
      else {
        await transactionsByEmployeeUtils.invalidateData()
        await transactionsByEmployeeUtils.fetchById(employeeId)
        setCurrentEmployee(employeeId)
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils, loadAllEmployees]
  )

  const viewMoreTransactions = useCallback(async () => {
      if (paginatedTransactions) {
        await paginatedTransactionsUtils.fetch(false)
      }
      else {
        await transactionsByEmployeeUtils.fetchById(currentEmployee)
      }
    }
  , [ paginatedTransactionsUtils, paginatedTransactions, currentEmployee, transactionsByEmployeeUtils ])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllEmployees()
    }
  }, [employeeUtils.loading, employees, loadAllEmployees])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions.data} />

          {transactions !== null && transactions.nextPage && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await viewMoreTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
