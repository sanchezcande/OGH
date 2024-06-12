import styled from 'styled-components';

const Button = styled.button`
background-color: ${({ theme }) => {
    // console.log(theme); 
    return theme.colors.primary;
}};
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 1em;
    
    &:hover {
        background-color: ${({ theme }) => theme.colors.primaryDark};
    }
    `;
    
export default Button;