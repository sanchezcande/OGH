import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

const AdminContainer = styled.div`
  max-width: 800px;
  margin: 3rem auto;
  padding: 2.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;

  h1 {
    color: #1f2937;
    margin-bottom: 2rem;
    font-size: 1.875rem;
    text-align: center;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.6rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0070f3;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #1f2937;
  font-size: 1rem;
  min-height: 300px;
  line-height: 1.5;
  transition: all 0.2s ease;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #0070f3;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #1f2937;
  font-size: 1rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
  }
`;

const SubmitButton = styled.button`
  background: #0070f3;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

export default function NewPost() {
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        lang: 'es',
        slug: '',
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const { edit: editSlug, lang: editLang } = router.query;

    React.useEffect(() => {
        if (editSlug) {
            const fetchArticle = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/blog/${editSlug}?lang=${editLang || 'es'}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFormData({
                            title: data.title,
                            summary: data.summary || '',
                            content: data.content,
                            lang: data.lang,
                            slug: data.slug,
                        });
                        setImage(data.image);
                        setIsEditing(true);
                    }
                } catch (error) {
                    console.error('Error fetching article for edit:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchArticle();
        }
    }, [editSlug, editLang]);

    const handleTitleChange = (e) => {
        if (isEditing) {
            setFormData({ ...formData, title: e.target.value });
            return;
        }
        const title = e.target.value;
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setFormData({ ...formData, title, slug });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4.5 * 1024 * 1024) {
                alert("El archivo es demasiado grande (máximo 4.5MB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/blog/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, image }),
            });

            if (res.ok) {
                router.push('/blog');
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            alert('Error en la conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminContainer>
            <h1>{isEditing ? 'Editar Publicación' : 'Crear Nueva Publicación'}</h1>
            <form onSubmit={handleSubmit}>
                <FormGroup>
                    <Label>Título</Label>
                    <Input
                        type="text"
                        required
                        value={formData.title}
                        onChange={handleTitleChange}
                    />
                </FormGroup>

                <FormGroup>
                    <Label>Slug (se genera solo)</Label>
                    <Input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                </FormGroup>

                <FormGroup>
                    <Label>Idioma</Label>
                    <Select value={formData.lang} onChange={(e) => setFormData({ ...formData, lang: e.target.value })}>
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                    </Select>
                </FormGroup>

                <FormGroup>
                    <Label>Resumen (opcional)</Label>
                    <Input
                        type="text"
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    />
                </FormGroup>

                <FormGroup>
                    <Label>Imagen</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {image && <img src={image} style={{ width: '100px', marginTop: '10px' }} />}
                </FormGroup>

                <FormGroup>
                    <Label>Contenido (Usa ## para títulos, - para listas)</Label>
                    <TextArea
                        required
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                </FormGroup>

                <SubmitButton type="submit" disabled={loading}>
                    {loading ? (isEditing ? 'Guardando...' : 'Publicando...') : (isEditing ? 'Guardar Cambios' : 'Publicar Artículo')}
                </SubmitButton>
            </form>
        </AdminContainer>
    );
}
