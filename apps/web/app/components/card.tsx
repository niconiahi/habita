import { type ComponentProps, type ReactNode } from "react"
import { Carousel } from "~/components/carousel"
import "~/components/card.css"

type RootProps = ComponentProps<"article">
function Root({ children, className, ...props }: RootProps) {
  const class_name = className ? `card ${className}` : "card"
  return (
    <article className={class_name} {...props}>
      {children}
    </article>
  )
}

type ImageProps = ComponentProps<"img">
function Image({ className, ...props }: ImageProps) {
  return <img className={className} {...props} />
}

type CarouselImage = {
  src: string
  srcSet?: string
  sizes?: string
  alt: string
}
type CardCarouselProps = {
  images: CarouselImage[]
  label: string
}
function CardCarousel({ images, label }: CardCarouselProps) {
  return (
    <Carousel.Root label={label}>
      {images.map((image, index) => {
        const key = `carousel-image-${index}`
        return (
          <Carousel.Slide key={key}>
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              alt={image.alt}
            />
          </Carousel.Slide>
        )
      })}
    </Carousel.Root>
  )
}

type BodyProps = ComponentProps<"div">
function Body({ children, className, ...props }: BodyProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

type TitleProps = ComponentProps<"h4">
function Title({ children, className, ...props }: TitleProps) {
  return (
    <h4 className={className} {...props}>
      {children}
    </h4>
  )
}

type ActionsProps = ComponentProps<"ul">
function Actions({ children, className, ...props }: ActionsProps) {
  return (
    <ul
      role="group"
      aria-label="card actions"
      className={className}
      {...props}
    >
      {children}
    </ul>
  )
}

type ActionProps = ComponentProps<"li">
function Action({ children, className, ...props }: ActionProps) {
  return (
    <li className={className} {...props}>
      {children}
    </li>
  )
}

type ContentProps = ComponentProps<"p">
function Content({ children, className, ...props }: ContentProps) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

export const Card = {
  Root,
  Image,
  Carousel: CardCarousel,
  Body,
  Title,
  Actions,
  Action,
  Content,
}
