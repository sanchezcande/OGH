import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

const AdminContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  color: white;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #222;
  color: white;
`;

const TextArea = styled.textarea`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #222;
  color: white;
  min-height: 300px;
`;

const Select = styled.select`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #222;
  color: white;
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
    const router = useRouter();

    const handleTitleChange = (e) => {
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
            <h1>Crear Nueva Publicación</h1>
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
                    {loading ? 'Publicando...' : 'Publicar Artículo'}
                </SubmitButton>
            </form>
        </AdminContainer>
    );
}
