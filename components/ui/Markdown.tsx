"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Link as ChakraLink, Text } from "@chakra-ui/react"

type MarkdownProps = {
    content: string
}

export default function Markdown({ content }: MarkdownProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children: nodeChildren }) => <Text>{nodeChildren}</Text>,
                a: ({ href, children: nodeChildren }) => (
                    <ChakraLink href={href ?? "#"} target="_blank" rel="noopener noreferrer" color="textColorMuted">
                        {nodeChildren}
                    </ChakraLink>
                ),
                strong: ({ children: nodeChildren }) => (
                    <Text as="span" fontWeight="bold">
                        {nodeChildren}
                    </Text>
                ),
                em: ({ children: nodeChildren }) => (
                    <Text as="span" fontStyle="italic">
                        {nodeChildren}
                    </Text>
                ),
                ul: ({ children: nodeChildren }) => (
                    <Text as="ul" style={{ listStyleType: "disc" }}>
                        {nodeChildren}
                    </Text>
                ),
                ol: ({ children: nodeChildren }) => (
                    <Text as="ol" style={{ listStyleType: "decimal" }}>
                        {nodeChildren}
                    </Text>
                ),
                li: ({ children: nodeChildren }) => <Text as="li">{nodeChildren}</Text>,
                code: ({ children: nodeChildren }) => (
                    <Text as="code" bg="blackAlpha.200" px={1} py={0.5} rounded="sm">
                        {nodeChildren}
                    </Text>
                ),
                blockquote: ({ children: nodeChildren }) => (
                    <Text as="blockquote" borderLeft="4px solid" borderColor="gray.300">
                        {nodeChildren}
                    </Text>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
