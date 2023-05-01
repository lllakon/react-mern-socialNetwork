import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from '../../axios'

import { selectIsAuth } from '../../redux/slices/auth'

import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import styles from './AddPost.module.scss'

export const AddPost = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const isAuth = useSelector(selectIsAuth)
	const [text, setText] = useState('')
	const [title, setTitle] = useState('')
	const [tags, setTags] = useState('')
	const [imageUrl, setImageUrl] = useState('')
	const inputFileRef = useRef(null)

	const isEditing = Boolean(id)

	const handleChangeFile = async (e) => {
		try {
			const formData = new FormData()
			const file = e.target.files[0]
			formData.append('image', file)
			const { data } = await axios.post('/upload', formData)
			setImageUrl(data.url)
		} catch (error) {
			console.warn(error)
			alert('Ошибка при загрузке файла')
		}
	}

	const onClickRemoveImage = () => {
		setImageUrl('')
	}

	const handleChangeTags = (e) => {
		const regex = /^(?! )[a-zA-Zа-яА-Я0-9 ]*$/
		if (regex.test(e.target.value)) {
			setTags(e.target.value.replace(/\s+/g, ' '))
		}
	}

	const onChange = useCallback((value) => {
		setText(value)
	}, [])

	const onSubmit = async () => {
		try {
			const fields = {
				title,
				imageUrl,
				tags,
				text,
			}

			const { data } = isEditing
				? await axios.patch(`/posts/${id}`, fields)
				: await axios.post('/posts', fields)

			const _id = isEditing ? id : data._id

			navigate(`/posts/${_id}`)
		} catch (error) {
			console.warn(error)
			alert('Ошибка при создании статья')
		}
	}

	useEffect(() => {
		if (id) {
			axios
				.get(`/posts/${id}`)
				.then(({ data }) => {
					setTitle(data.title)
					setTags(data.tags.join(',').replace(/,/g, ' '))
					setText(data.text)
					setImageUrl(data.imageUrl)
				})
				.catch((error) => {
					console.warn(error)
					alert('Ошибка получения статьи')
				})
		}
	}, [])

	const options = useMemo(
		() => ({
			spellChecker: false,
			maxHeight: '400px',
			autofocus: true,
			placeholder: 'Текст статьи...',
			status: false,
			autosave: {
				enabled: true,
				delay: 1000,
				uniqueId: 'create-post',
			},
		}),
		[]
	)

	if (!window.localStorage.getItem('token') && !isAuth) {
		return <Navigate to='/login' />
	}

	return (
		<Paper style={{ padding: 30 }}>
			<Button
				onClick={() => inputFileRef.current.click()}
				variant='outlined'
				size='large'
			>
				Загрузить превью
			</Button>
			<input ref={inputFileRef} type='file' onChange={handleChangeFile} hidden />
			{imageUrl && (
				<>
					<Button variant='contained' color='error' onClick={onClickRemoveImage}>
						Удалить
					</Button>
					<img
						className={styles.image}
						src={`http://localhost:4444${imageUrl}`}
						alt='Uploaded'
					/>
				</>
			)}

			<br />
			<br />
			<TextField
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				classes={{ root: styles.title }}
				variant='standard'
				placeholder='Заголовок статьи...'
				fullWidth
			/>
			<TextField
				value={tags}
				onChange={handleChangeTags}
				classes={{ root: styles.tags }}
				variant='standard'
				placeholder='Тэги'
				fullWidth
				spellCheck={false}
			/>
			<SimpleMDE
				className={styles.editor}
				value={text}
				onChange={onChange}
				options={options}
			/>
			<div className={styles.buttons}>
				<Button onClick={onSubmit} size='large' variant='contained'>
					{isEditing ? 'Сохранить' : 'Опубликовать'}
				</Button>
				<a href='/'>
					<Button size='large'>Отмена</Button>
				</a>
			</div>
		</Paper>
	)
}
