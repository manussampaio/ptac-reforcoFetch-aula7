import './App.css'
import CrudUsuarios from './components/CrudUsuarios'
import { apiGet } from './api'

apiGet('/users').then(console.log)

function App() {


  return (
    <>
      <CrudUsuarios />
    </>
  )
}

export default App
