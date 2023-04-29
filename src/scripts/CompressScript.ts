import tar from 'tar';

!async function () {
    await tar.c(
        {
            gzip: true,
            file: 'controller.tar'
        },
        ['controller']
        // https://blog.outsider.ne.kr/1381
        // https://stackoverflow.com/questions/15809611/bcrypt-invalid-elf-header-when-running-node-app
        // https://velog.io/@shyuuuuni/node-libx8664-linux-gnulibc.so.6-version-GLIBC2.28-not-found-required-by-node-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0-%EC%82%AC%EB%A1%80
        // 리눅스 환경(WSL 등)에서 빌드 바람
    );
}();