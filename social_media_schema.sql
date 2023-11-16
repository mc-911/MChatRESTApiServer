--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

-- Started on 2023-11-17 00:31:56

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 8 (class 2615 OID 16398)
-- Name: social_media_schema; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA social_media_schema;


ALTER SCHEMA social_media_schema OWNER TO postgres;

--
-- TOC entry 3 (class 3079 OID 16449)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 4850 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- TOC entry 2 (class 3079 OID 16439)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 4851 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


--
-- TOC entry 1 (class 3079 OID 16428)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA social_media_schema;


--
-- TOC entry 4852 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16399)
-- Name: user; Type: TABLE; Schema: social_media_schema; Owner: postgres
--

CREATE TABLE social_media_schema."user" (
    user_id uuid NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL
);


ALTER TABLE social_media_schema."user" OWNER TO postgres;

--
-- TOC entry 4701 (class 2606 OID 16405)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: social_media_schema; Owner: postgres
--

ALTER TABLE ONLY social_media_schema."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


-- Completed on 2023-11-17 00:31:56

--
-- PostgreSQL database dump complete
--

