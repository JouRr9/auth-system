CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp with time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;



CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    nickname character varying(12) NOT NULL,
    is_social boolean DEFAULT false NOT NULL,
    password character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;


CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;



ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;