import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "../api";

apiPost('/users', { name: 'Teste' }, {
    headers: { 'X-Custom': 'aula07' }
});

const listarUsuarios = (signal) => apiGet('/users', { signal })
const criarUsuario = (dados) => apiPost('/users', dados)
const atualizarUsuario = (id, dados) => apiPut(`/users/${id}`)
const excluirUsuario = (id) => apiDelete(`/users/${id}`)


function mensagemDeErro(e) {
    if (e instanceof ApiError) {
        if (e.status === 404) return 'Recurso não encontrado.'
        if (e.status >= 500) return 'Erro no servidor. Tente de novo em instantes.'
        return `Erro ${e.status}: ${e.statusText}`
    }
    return 'Falha de rede: ' + e.message
}

export default function CrudUsuarios() {
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState(null)

    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({ name: '', email: '' })
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState(null)

    const [excluindoId, setExcluindoId] = useState(null)
    const [erroExclusao, setErroExclusao] = useState(null)

    const controllersRef = useRef(new Set())

    useEffect(() => {
        return () => {
            controllersRef.current.forEach((controller) => controller.abort())
            controllersRef.current.clear()
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        controllersRef.current.add(controller)

        async function buscarUsuarios() {
            setLoading(true)
            setErro(null)

            try {
                const data = await listarUsuarios(controller.signal)
                setUsuarios(data)
            } catch (e) {
                if (e.name === 'AbortError') return
                setErro(mensagemDeErro(e))
            } finally {
                controllersRef.current.delete(controller)
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        buscarUsuarios()

        return () => controller.abort()
    }, [])

    function editar(usuario) {
        setEditando(usuario)
        setForm({ name: usuario.name, email: usuario.email })
        setErroForm(null)
    }

    function limparForm() {
        setEditando(null)
        setForm({ name: '', email: '' })
        setErroForm(null)
    }

    function handleFormChange(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }))
    }

    async function salvar(event) {
        event.preventDefault()

        setSalvando(true)
        setErroForm(null)

        if (editando) {
            const prev = usuarios

            setUsuarios((atuais) =>
                atuais.map((u) => (u.id === editando.id ? { ...u, ...form } : u))
            )

            try {
                const atualizado = await atualizarUsuario(editando.id, form)
                setUsuarios((atuais) =>
                    atuais.map((u) => (u.id === editando.id ? atualizado : u))
                )
                limparForm()
            } catch (err) {
                setUsuarios(prev)
                setErroForm(mensagemDeErro(err))
            } finally {
                setSalvando(false)
            }
        } else {
            try {
                const criado = await criarUsuario(form)
                setUsuarios((atuais) => [...atuais, criado])
                limparForm()
            } catch (err) {
                setErroForm(mensagemDeErro(err))
            } finally {
                setSalvando(false)
            }
        }
    }

    async function tentarExcluir(id) {
        const prev = usuarios

        setExcluindoId(id)
        setErroExclusao(null)
        setUsuarios(prev.filter((u) => u.id !== id))

        try {
            await excluirUsuario(id)
        } catch (err) {
            setUsuarios(prev)
            setErroExclusao(mensagemDeErro(err))
        } finally {
            setExcluindoId(null)
        }
    }

    if (loading) return <p>Carregando usuários...</p>

    return (
        <div>
            <h2>Usuários</h2>

            {erro && <p>Erro: {erro}</p>}
            {erroExclusao && <p>Erro ao excluir: {erroExclusao}</p>}

            <form onSubmit={salvar}>
                <h3>{editando ? `Editar usuário #${editando.id}` : 'Novo usuário'}</h3>

                <label>
                    Nome:
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        required
                    />
                </label>

                <label>
                    E-mail:
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
                </button>
                <button type="button" onClick={limparForm} disabled={salvando}>
                    Limpar
                </button>

                {erroForm && <p>Erro ao salvar: {erroForm}</p>}
            </form>

            <ul>
                {usuarios.map((usuario) => (
                    <li key={usuario.id}>
                        {usuario.name} - {usuario.email}
                        <button onClick={() => editar(usuario)} style={{ marginLeft: '10px' }}>
                            Editar
                        </button>
                        <button
                            onClick={() => tentarExcluir(usuario.id)}
                            disabled={excluindoId === usuario.id}
                            style={{ marginLeft: '10px' }}
                        >
                            {excluindoId === usuario.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
